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
    // Truncate prompt to stay within model limits (OpenAI limit is 4000)
    const truncatedPrompt = prompt.substring(0, 3000);
    if (!truncatedPrompt) throw new Error("Prompt is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    let errorDetails = "";

    // 1. Try Gemini (Imagen 3)
    if (GEMINI_API_KEY) {
      try {
        console.log(`Attempting image generation with Gemini/Imagen 3...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: `A professional, high-quality cinematic thumbnail for a wellness/health theme: ${truncatedPrompt}. Minimalist, clean, modern aesthetic. No text on image.` }],
              parameters: { sampleCount: 1, aspectRatio: "16:9" }
            }),
          }
        );

        if (response.ok) {
          const aiData = await response.json();
          const prediction = aiData.predictions?.[0];
          if (prediction?.bytesBase64Encoded) {
            const base64Data = prediction.bytesBase64Encoded;
            const mimeType = prediction.mimeType || "image/png";
            const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            return await uploadToSupabase(new Blob([binaryData], { type: mimeType }), folder, mimeType);
          }
        } else {
          const errText = await response.text();
          console.error("Gemini failed:", errText);
          errorDetails += `Gemini: ${response.status} ${errText} | `;
        }
      } catch (e: any) {
        console.error("Gemini exception:", e.message);
        errorDetails += `Gemini Exception: ${e.message} | `;
      }
    }

    // 2. Try OpenAI (DALL-E 3)
    if (OPENAI_API_KEY) {
      try {
        console.log(`Attempting fallback image generation with OpenAI DALL-E 3...`);
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `A professional, high-quality cinematic thumbnail for a wellness/health video. Theme: ${truncatedPrompt}. Minimalist, clean, modern aesthetic. No text on image.`,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const imageUrl = aiData.data[0].url;
          const imageRes = await fetch(imageUrl);
          const blob = await imageRes.blob();
          return await uploadToSupabase(blob, folder, "image/png");
        } else {
          const errText = await response.text();
          console.error("OpenAI failed:", errText);
          errorDetails += `OpenAI: ${response.status} ${errText} | `;
        }
      } catch (e: any) {
        console.error("OpenAI exception:", e.message);
        errorDetails += `OpenAI Exception: ${e.message} | `;
      }
    }

    throw new Error(`AI generation failed. ${errorDetails}`);
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function uploadToSupabase(blob: Blob, folder: string, contentType: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const fileName = `${Date.now()}.png`;
  const filePath = `${folder}/${fileName}`;

  const { data, error: uploadError } = await supabaseAdmin.storage
    .from("media")
    .upload(filePath, blob, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage.from("media").getPublicUrl(filePath);
  return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json"
    },
    status: 200,
  });
}
