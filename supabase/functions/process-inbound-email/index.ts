import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Receive Inbound Email Webhook (e.g. from Postmark or similar)
    const payload = await req.json();
    console.log("Inbound Email Payload:", JSON.stringify(payload).substring(0, 500));

    // Postmark format: { From: "...", Subject: "...", TextBody: "...", HtmlBody: "..." }
    const subject = payload.Subject || payload.subject || "Untitled Content";
    const body = payload.TextBody || payload.text_body || payload.body || payload.HtmlBody || "";
    const from = payload.From || payload.from || "unknown";

    if (!body) throw new Error("Email body is empty");

    // 2. Use AI (Gemini) to classify and extract content
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

    const prompt = `You are an expert content editor for 'Lifestyle Medicine Gateway', a professional wellness platform.
    Analyze the following email and determine if it is an Article, Recipe, Meme Idea, or Chart/Infographic Idea.
    
    EMAIL SUBJECT: ${subject}
    EMAIL BODY: ${body}
    
    GUIDELINES:
    - Articles: Informative, research-backed, professional tone.
    - Recipes: List of ingredients and clear steps.
    - Memes: Humorous but health-conscious ideas.
    - Charts: Data-driven or process-driven infographic ideas.
    
    Extract and return a valid JSON object ONLY:
    {
      "type": "article" | "recipe" | "meme" | "chart",
      "title": "A catchy, SEO-friendly title",
      "slug": "kebab-case-slug",
      "content": "Clean, well-formatted markdown or simple HTML. Use headers (h1, h2), bold text, and lists.",
      "excerpt": "A short 150-160 character preview",
      "category": "Lifestyle" | "Nutrition" | "Mental Health" | "Fitness" | "General",
      "image_prompt": "A descriptive prompt for an AI to generate a stunning cinematic wellness photo for this content. No text in image.",
      "meta_data": {
        "ingredients": ["list", "of", "ingredients if recipe"],
        "instructions": ["list", "of", "steps if recipe"],
        "prep_time": "e.g. 15 mins",
        "cook_time": "e.g. 30 mins"
      }
    }`;

    console.log("Calling Gemini for content extraction...");
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      throw new Error(`Gemini failed: ${err}`);
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("No response from AI");

    const contentData = JSON.parse(resultText);
    console.log("Extracted Content Type:", contentData.type);

    // 3. Generate AI Image
    let imageUrl = "https://www.lifestylemedicinegateway.com/logo.png";
    try {
      console.log("Triggering AI Image generation...");
      const imageRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-ai-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          prompt: contentData.image_prompt,
          folder: contentData.type === 'article' ? 'article-thumbnails' : 'media'
        })
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        imageUrl = imageData.url;
      } else {
        console.warn("Image generation failed, using logo fallback.");
      }
    } catch (e) {
      console.error("Image generation error:", e);
    }

    // 4. Save to Database
    let dbResult;
    if (contentData.type === "article") {
      dbResult = await supabaseAdmin.from("articles").insert({
        title: contentData.title,
        slug: contentData.slug,
        content: contentData.content,
        excerpt: contentData.excerpt,
        image_url: imageUrl,
        category_name: contentData.category,
        author_id: "77777777-7777-7777-7777-777777777777", // System/Admin ID or detect from 'from'
        status: "draft" // Always start as draft for review
      });
    } else if (contentData.type === "recipe") {
      dbResult = await supabaseAdmin.from("recipes").insert({
        title: contentData.title,
        slug: contentData.slug,
        content: contentData.content,
        excerpt: contentData.excerpt,
        image_url: imageUrl,
        prep_time: contentData.meta_data?.prep_time,
        cook_time: contentData.meta_data?.cook_time,
        author_id: "77777777-7777-7777-7777-777777777777",
        status: "draft"
      });
    } else {
      // Meme or Chart -> Save to media_assets or similar
      dbResult = await supabaseAdmin.from("media_assets").insert({
        title: contentData.title,
        description: contentData.content,
        url: imageUrl,
        type: contentData.type,
        category: contentData.category,
        status: "pending"
      });
    }

    if (dbResult?.error) throw dbResult.error;

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Content processed as ${contentData.type}`,
      id: dbResult?.data?.[0]?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Inbound Email Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
