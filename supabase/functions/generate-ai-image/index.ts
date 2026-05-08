// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, folder = "ai-thumbnails" } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");

    console.log(`Generating AI image with Gemini for prompt: ${prompt}`);

    // 1. Call Gemini 2.0 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a high-quality, professional cinematic thumbnail image for a wellness/health theme: ${prompt}. Minimalist, clean, modern aesthetic. No text on image.` }] }],
          generationConfig: {
            response_modalities: ["IMAGE"]
          }
        }),
      }
    );

    const aiData = await response.json();
    if (aiData.error) throw new Error(aiData.error.message);
    
    const imagePart = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart) {
       console.error("Gemini Response:", JSON.stringify(aiData));
       throw new Error("Gemini failed to generate an image. Check your prompt or API key permissions.");
    }

    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    console.log(`Successfully generated image with mimeType: ${mimeType}`);

    // 2. Convert base64 to Blob
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: mimeType });

    // 3. Upload to Supabase Storage
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const fileName = `${Date.now()}.png`;
    const filePath = `${folder}/${fileName}`;

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(filePath, blob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage.from("media").getPublicUrl(filePath);

    return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
