import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.568.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_CUSTOM_DOMAIN = Deno.env.get("R2_CUSTOM_DOMAIN");

    // 1. Identify if it's an R2 URL
    const isR2 = 
      (R2_CUSTOM_DOMAIN && url.includes(R2_CUSTOM_DOMAIN)) || 
      (R2_ENDPOINT && url.includes(R2_ENDPOINT.replace('https://', '')));

    if (!isR2) {
      return new Response(JSON.stringify({ message: "Not an R2 URL, skipping R2 deletion" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Extract Key (fileName)
    let key = "";
    if (R2_CUSTOM_DOMAIN && url.includes(R2_CUSTOM_DOMAIN)) {
      key = url.split(`${R2_CUSTOM_DOMAIN}/`)[1];
    } else {
      // Endpoint format: https://[accountid].r2.cloudflarestorage.com/[bucket]/[key]
      key = url.split(`${R2_BUCKET_NAME}/`)[1];
    }

    if (!key) throw new Error("Could not extract key from URL");

    // 3. Initialize S3 Client
    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });

    // 4. Delete Object
    console.log(`Deleting ${key} from R2...`);
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return new Response(JSON.stringify({ success: true, message: `Deleted ${key} from R2` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Deletion Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
