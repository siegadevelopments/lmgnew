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

// Cache font to avoid re-fetching on every request
let cachedFont: Uint8Array | null = null;
async function getFont() {
  if (cachedFont) return cachedFont;
  try {
    const fontRes = await fetch("https://github.com/google/fonts/raw/main/ofl/outfit/Outfit-Bold.ttf");
    if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
    cachedFont = new Uint8Array(await fontRes.arrayBuffer());
    return cachedFont;
  } catch (e) {
    console.error("Failed to fetch font, using default:", e);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new Error("Invalid JSON body");

    const { prompt, folder = "ai-thumbnails", author_id } = body;
    if (!prompt) throw new Error("Prompt is required");

    const truncatedPrompt = typeof prompt === 'string' ? prompt.substring(0, 3000) : "Wellness lifestyle";
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    let errorDetails = "";

    // 1. Try Gemini (Imagen 3)
    if (GEMINI_API_KEY) {
      try {
        console.log(`Attempting image generation with Gemini...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ 
                prompt: `A stunning, high-quality cinematic lifestyle photograph representing: ${truncatedPrompt.substring(0, 500)}. Style: Modern, minimalist, premium wellness aesthetic. CRITICAL: No text, no labels, no anatomical diagrams.` 
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
          errorDetails += `Gemini Error (${response.status}): ${errText.substring(0, 100)}... | `;
        }
      } catch (e: any) {
        errorDetails += `Gemini Exception: ${e.message} | `;
      }
    } else {
      errorDetails += "GEMINI_API_KEY not set | ";
    }

    // 2. Try OpenAI (DALL-E 3)
    if (OPENAI_API_KEY) {
      try {
        console.log(`Attempting fallback image generation with OpenAI...`);
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `A stunning, high-quality cinematic lifestyle photograph representing: ${truncatedPrompt.substring(0, 500)}. Style: Modern, minimalist, premium wellness aesthetic. No text.`,
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
          errorDetails += `OpenAI Error (${response.status}): ${errText.substring(0, 100)}... | `;
        }
      } catch (e: any) {
        errorDetails += `OpenAI Exception: ${e.message} | `;
      }
    } else {
      errorDetails += "OPENAI_API_KEY not set | ";
    }

    throw new Error(`AI generation failed. Details: ${errorDetails}`);
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestion: "Check your Gemini/OpenAI API keys in Supabase Edge Function secrets."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function watermarkImage(imageBlob: Blob, authorId: string | null) {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let logoUrl = null;
    let vendorName = "Lifestyle Medicine Gateway";
    let representativeName = null;

    if (authorId && authorId.trim() !== "") {
      const { data: vendor } = await supabaseAdmin
        .from('vendor_profiles')
        .select('store_logo_url, store_name, representative_name')
        .eq('id', authorId)
        .single();
      
      if (vendor) {
        logoUrl = vendor.store_logo_url;
        vendorName = vendor.store_name;
        representativeName = vendor.representative_name;
      }
    }

    if (!logoUrl || logoUrl.toLowerCase().endsWith('.svg')) {
      logoUrl = "https://www.lifestylemedicinegateway.com/logo.png";
    }
    
    const logoRes = await fetch(logoUrl);
    if (!logoRes.ok) return imageBlob;
    
    const logoData = new Uint8Array(await logoRes.arrayBuffer());
    const mainImageData = new Uint8Array(await imageBlob.arrayBuffer());
    
    const mainImg = await Image.decode(mainImageData);
    const logoImg = await Image.decode(logoData);
    
    const targetWidth = mainImg.width * 0.06;
    logoImg.resize(targetWidth, Image.RESIZE_AUTO);
    
    const attributionText = representativeName ? `By ${representativeName}` : vendorName;
    const fontData = await getFont();
    let textImg = null;
    if (fontData) {
      textImg = Image.renderText(fontData, Math.max(14, mainImg.width * 0.014), attributionText, 0x1e293bff);
    }
    
    const padding = 10;
    const spacing = 8;
    const bgWidth = logoImg.width + (textImg ? textImg.width + spacing : 0) + (padding * 2);
    const bgHeight = Math.max(logoImg.height, textImg ? textImg.height : 0) + (padding * 2);
    
    const bg = new Image(bgWidth, bgHeight);
    bg.fill(0xffffffff); 
    
    bg.composite(logoImg, padding, (bgHeight - logoImg.height) / 2);
    if (textImg) {
      bg.composite(textImg, padding + logoImg.width + spacing, (bgHeight - textImg.height) / 2);
    }
    
    mainImg.composite(bg, mainImg.width - bg.width - 50, mainImg.height - bg.height - 50);
    const finalBuffer = await mainImg.encode();
    return new Blob([finalBuffer], { type: 'image/png' });
  } catch (e) {
    console.error("Watermarking failed:", e);
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

  const { error: uploadError } = await supabaseAdmin.storage
    .from("media")
    .upload(filePath, blob, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage.from("media").getPublicUrl(filePath);
  return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
