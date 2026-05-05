import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    if (!record || record.status !== "uploading") {
      return new Response(JSON.stringify({ message: "Skipping: Not an automated upload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log(`Processing video upload for ID: ${record.id}`);

    // 1. Get Credentials
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error("Missing Google API credentials");
    }

    // 2. Resolve the file path
    let filePath = "";
    if (record.embed_url && record.embed_url.startsWith("storage://")) {
      filePath = record.embed_url.replace("storage://", "");
    } else {
      // Fallback: search for the latest file
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from("video-uploads")
        .list(record.author_id);

      if (listError || !files || files.length === 0) {
        throw new Error("No files found in storage for this vendor");
      }
      const latestFile = files.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      filePath = `${record.author_id}/${latestFile.name}`;
    }

    // 3. Get Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error(`Failed to refresh Google token: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // 4. Download file from storage
    console.log(`Downloading file from storage: ${filePath}`);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("video-uploads")
      .download(filePath);

    if (downloadError) throw downloadError;

    // 5. Upload to YouTube
    console.log(`Uploading to YouTube: ${record.title}`);

    const metadata = {
      snippet: {
        title: record.title,
        description: record.description || "Uploaded via Lifestyle Medicine Gateway",
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: false,
      },
    };

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/*",
          "X-Upload-Content-Length": fileData.size.toString(),
        },
        body: JSON.stringify(metadata),
      },
    );

    const uploadUrl = uploadResponse.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("Failed to initiate YouTube upload");
    }

    const finalResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/*" },
      body: fileData,
    });

    const youtubeData = await finalResponse.json();
    if (!youtubeData.id) {
      throw new Error(`YouTube upload failed: ${JSON.stringify(youtubeData)}`);
    }

    console.log(`YouTube upload successful! ID: ${youtubeData.id}`);

    // 6. Update Database
    const { error: updateError } = await supabaseAdmin
      .from("videos")
      .update({
        status: "ready",
        embed_url: `https://www.youtube.com/embed/${youtubeData.id}`,
        youtube_id: youtubeData.id,
      })
      .eq("id", record.id);

    if (updateError) throw updateError;

    // 7. Cleanup Storage
    await supabaseAdmin.storage.from("video-uploads").remove([filePath]);

    return new Response(JSON.stringify({ success: true, youtube_id: youtubeData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in upload-to-youtube:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
