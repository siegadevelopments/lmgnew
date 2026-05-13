import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, type = "recipe" } = await req.json();
    if (!title) throw new Error("Title is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "recipe") {
      systemPrompt = "You are a world-class health conscious chef specializing in lifestyle medicine. Your recipes are nutritious, balanced, and delicious.";
      userPrompt = `Generate a complete, healthy recipe titled "${title}". 
      Format the output using clean HTML (without head/body tags). 
      Include sections for:
      - <h2>Ingredients</h2> (as a <ul> list)
      - <h2>Instructions</h2> (as an <ol> list)
      - <p><em>Health Tip: [A short sentence about why this is good for you]</em></p>
      Use only HTML tags: h2, p, ul, ol, li, strong, em. Do not include the title in the body.`;
    } else {
      systemPrompt = "You are a professional health and wellness journalist.";
      userPrompt = `Write a professional, evidence-based article about "${title}". 
      Use clean HTML formatting with h2, p, ul, li.`;
    }

    let generatedContent = "";

    // 1. Try Gemini
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                role: "user", 
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              }
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          // Clean up markdown code blocks if any
          generatedContent = generatedContent.replace(/```html/g, "").replace(/```/g, "").trim();
        }
      } catch (e) {
        console.error("Gemini failed:", e);
      }
    }

    // 2. Try OpenAI Fallback
    if (!generatedContent && OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedContent = data.choices?.[0]?.message?.content || "";
          generatedContent = generatedContent.replace(/```html/g, "").replace(/```/g, "").trim();
        }
      } catch (e) {
        console.error("OpenAI failed:", e);
      }
    }

    if (!generatedContent) {
      throw new Error("AI Content generation failed. Check API keys.");
    }

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
