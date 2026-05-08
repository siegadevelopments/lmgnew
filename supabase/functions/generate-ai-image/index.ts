// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, folder = "ai-thumbnails", author_id } = await req.json();
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
              instances: [{ 
                prompt: `A stunning, high-quality cinematic lifestyle photograph representing: ${truncatedPrompt.substring(0, 500)}. 
                        Style: Modern, minimalist, premium wellness aesthetic. 
                        CRITICAL: No text, no labels, no anatomical diagrams, no charts. 
                        Focus on mood, lighting, and a serene environment or abstract wellness representation.` 
              }],
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
            const watermarkedBlob = await watermarkImage(new Blob([binaryData], { type: mimeType }), author_id);
            return await uploadToSupabase(watermarkedBlob, folder, "image/png");
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
            prompt: `A stunning, high-quality cinematic lifestyle photograph representing: ${truncatedPrompt.substring(0, 500)}. 
                    Style: Modern, minimalist, premium wellness aesthetic. 
                    CRITICAL: No text, no labels, no anatomical diagrams, no charts. 
                    Focus on mood, lighting, and a serene environment or abstract wellness representation.`,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const imageUrl = aiData.data[0].url;
          const imageRes = await fetch(imageUrl);
          const blob = await imageRes.blob();
          const watermarkedBlob = await watermarkImage(blob, author_id);
          return await uploadToSupabase(watermarkedBlob, folder, "image/png");
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

async function watermarkImage(imageBlob: Blob, authorId: string | null) {
  console.log(`Watermark request for authorId: ${authorId}`);
  if (!authorId) {
    console.log("No authorId provided, skipping watermark");
    return imageBlob;
  }
  
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendor_profiles')
      .select('store_logo_url')
      .eq('id', authorId)
      .single();
    
    if (vendorError) {
      console.error("Error fetching vendor profile:", vendorError);
      return imageBlob;
    }

    let logoUrl = vendor?.store_logo_url;
    
    if (!logoUrl) {
      console.log(`No store_logo_url found for vendor ${authorId}. Using site fallback.`);
      // Use the site's main logo as a fallback
      logoUrl = "https://www.lifestylemedicinegateway.com/logo.png";
    }

    if (logoUrl.toLowerCase().endsWith('.svg')) {
      console.warn("SVG logos are not supported. Using site fallback.");
      logoUrl = "https://www.lifestylemedicinegateway.com/logo.png";
    }
    
    console.log(`Fetching logo from: ${logoUrl}`);
    const logoRes = await fetch(logoUrl);
    if (!logoRes.ok) {
      console.error(`Failed to fetch logo from ${logoUrl}: ${logoRes.status}`);
      return imageBlob;
    }
    
    const logoData = new Uint8Array(await logoRes.arrayBuffer());
    const mainImageData = new Uint8Array(await imageBlob.arrayBuffer());
    
    const mainImg = await Image.decode(mainImageData);
    const logoImg = await Image.decode(logoData);
    
    // Resize logo to ~12% of main image width (smaller and more professional)
    const targetWidth = mainImg.width * 0.12;
    logoImg.resize(targetWidth, Image.RESIZE_AUTO);
    
    // Create a small white semi-transparent background box for visibility
    const padding = 10;
    const bgWidth = logoImg.width + (padding * 2);
    const bgHeight = logoImg.height + (padding * 2);
    const bg = new Image(bgWidth, bgHeight);
    bg.fill(0xffffff88); // Semi-transparent white
    
    // Composite logo onto background
    bg.composite(logoImg, padding, padding);
    
    // Composite the watermarked logo bottom-right with 40px padding
    mainImg.composite(bg, mainImg.width - bg.width - 40, mainImg.height - bg.height - 40);
    
    console.log("Watermark applied successfully with background");
    const finalBuffer = await mainImg.encode();
    return new Blob([finalBuffer], { type: 'image/png' });
  } catch (e) {
    console.error("Watermarking failed, returning original image:", e);
    return imageBlob;
  }
}

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
