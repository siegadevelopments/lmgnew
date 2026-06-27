// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanRawJsonContent(str: string): string {
  let clean = str.trim();
  
  // Remove leading/trailing markdown code blocks
  clean = clean.replace(/^```(json|html)?\s*/i, "").replace(/\s*```$/, "");
  
  // If it starts with { or contains "content" key, try to parse/extract
  if (clean.startsWith("{") || clean.includes('"content"')) {
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      const toParse = jsonMatch ? jsonMatch[0] : clean;
      const parsed = JSON.parse(toParse);
      if (parsed.content) return parsed.content;
    } catch (_) {
      // Regex match content key anywhere in the string
      const contentMatch = clean.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"(?:prep_time|cook_time|instructions)"|\})/i);
      if (contentMatch && contentMatch[1]) {
        return contentMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
      }

      const contentMatchSimple = clean.match(/"content"\s*:\s*"([\s\S]*?)"/i);
      if (contentMatchSimple && contentMatchSimple[1]) {
        return contentMatchSimple[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
      }
      
      // Fallback: manually strip everything before {"content": " and trailing ,"prep_time"... }
      let stripped = clean;
      const contentIndex = stripped.indexOf('"content"');
      if (contentIndex !== -1) {
        const colonIndex = stripped.indexOf(':', contentIndex);
        if (colonIndex !== -1) {
          const quoteIndex = stripped.indexOf('"', colonIndex);
          if (quoteIndex !== -1) {
            stripped = stripped.substring(quoteIndex + 1);
          }
        }
      }
      stripped = stripped.replace(/"\s*,\s*"(?:prep_time|cook_time|reasoning|role|tags|title)"[\s\S]*$/i, "");
      stripped = stripped.replace(/"\s*\}?\s*$/i, "");
      
      return stripped.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    }
  }
  
  return clean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, type = "recipe", imageUrl, textsToCheck } = await req.json();
    if (!title && !imageUrl && !textsToCheck) throw new Error("Title, Image, or Text is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let base64Image = null;
    let mimeType = "image/jpeg";
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        base64Image = base64Encode(new Uint8Array(arrayBuffer));
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      } catch (e) {
        console.error("Failed to fetch/encode image:", e);
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "recipe") {
      systemPrompt = "You are a world-class health conscious chef specializing in lifestyle medicine. Your recipes are nutritious, balanced, and delicious.";
      if (base64Image) {
        userPrompt = `Analyze the provided image of food. Identify the dish and generate a complete, healthy recipe for it. 
        Return the result as a STRICT JSON object with these exact keys:
        - "title": A descriptive, appetizing title for the recipe.
        - "content": Clean HTML (ingredients as <ul>, instructions as <ol>, and a health tip). Use h2, p, ul, ol, li, strong, em.
        - "prep_time": Estimated prep time in minutes (integer).
        - "cook_time": Estimated cook time in minutes (integer).
        - "tags": An array of strings representing categories (e.g. ["Mains", "Vegan", "Gluten-Free"]).
        
        CRITICAL: Return ONLY the JSON object. Do not include markdown code blocks. Start directly with { and end with }.`;
      } else {
        userPrompt = `Generate a complete, healthy recipe titled "${title}". 
        Return the result as a STRICT JSON object with these exact keys:
        - "content": Clean HTML (ingredients as <ul>, instructions as <ol>, and a health tip). Use h2, p, ul, ol, li, strong, em.
        - "prep_time": Estimated prep time in minutes (integer).
        - "cook_time": Estimated cook time in minutes (integer).
        
        CRITICAL: Return ONLY the JSON object. Do not include markdown code blocks. Start directly with { and end with }.`;
      }
    } else if (type === "product" || type === "product_description") {
      systemPrompt = "You are a creative copywriter specializing in healthy products and lifestyle medicine.";
      userPrompt = `Write an engaging, persuasive product description for "${title}". 
      Include key benefits, how to use, and why it's good for wellness. Use clean HTML formatting with p, ul, li, strong.`;
    } else if (type === "grammar") {
      systemPrompt = "You are an expert copyeditor and proofreader.";
      userPrompt = `Fix all spelling and grammatical errors in the following JSON object's string values without changing the underlying meaning or HTML structure. 
      Return the result as a STRICT JSON object with the exact same keys you received.
      
      Input JSON to correct:
      ${JSON.stringify(textsToCheck, null, 2)}
      
      CRITICAL: Return ONLY the JSON object. Do not include markdown code blocks.`;
    } else {
      systemPrompt = "You are a professional health and wellness journalist.";
      userPrompt = `Write a professional, evidence-based article about "${title}". 
      Use clean HTML formatting with h2, p, ul, li.`;
    }

    let generatedContent = "";
    let errorDetails = "";

    // 1. Try Gemini
    if (GEMINI_API_KEY) {
      try {
        const parts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
        if (base64Image) {
          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                ...( (type === "recipe" || type === "grammar") ? { responseMimeType: "application/json" } : {} )
              }
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          generatedContent = generatedContent.replace(/```json/g, "").replace(/```html/g, "").replace(/```/g, "").trim();
        } else {
          const errText = await response.text();
          errorDetails += `Gemini Error (${response.status}): ${errText.substring(0, 150)}... | `;
        }
      } catch (e: any) {
        console.error("Gemini failed:", e);
        errorDetails += `Gemini Exception: ${e.message} | `;
      }
    } else {
      errorDetails += "GEMINI_API_KEY not set | ";
    }

    // 2. Try OpenAI Fallback
    if (!generatedContent && OPENAI_API_KEY) {
      try {
        const messages: any[] = [
          { role: "system", content: systemPrompt }
        ];

        if (base64Image) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          });
        } else {
          messages.push({ role: "user", content: userPrompt });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.7,
            ...( (type === "recipe" || type === "grammar") ? { response_format: { type: "json_object" } } : {} ),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedContent = data.choices?.[0]?.message?.content || "";
          generatedContent = generatedContent.replace(/```json/g, "").replace(/```html/g, "").replace(/```/g, "").trim();
        } else {
          const errText = await response.text();
          errorDetails += `OpenAI Error (${response.status}): ${errText.substring(0, 150)}... | `;
        }
      } catch (e: any) {
        console.error("OpenAI failed:", e);
        errorDetails += `OpenAI Exception: ${e.message} | `;
      }
    } else {
      errorDetails += "OPENAI_API_KEY not set | ";
    }

    // 3. Try Pollinations AI (100% Free & Keyless Fallback) - Does not support images easily via standard REST without proper formatting
    if (!generatedContent && !base64Image) {
      try {
        console.log("Attempting keyless fallback text generation with Pollinations AI...");
        const response = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            private: true,
            ...( (type === "recipe" || type === "grammar") ? { jsonMode: true } : {} )
          })
        });

        if (response.ok) {
          generatedContent = await response.text();
          generatedContent = generatedContent.replace(/```json/g, "").replace(/```html/g, "").replace(/```/g, "").trim();
          console.log("Successfully generated text with Pollinations AI fallback!");
        } else {
          errorDetails += `Pollinations AI Error (${response.status}) | `;
        }
      } catch (e: any) {
        console.error("Pollinations AI failed:", e);
        errorDetails += `Pollinations AI Exception: ${e.message} | `;
      }
    }

    if (!generatedContent) {
      throw new Error(`AI Content generation failed. Details: ${errorDetails}`);
    }

    let result: any = { content: cleanRawJsonContent(generatedContent), prep_time: 15, cook_time: 15 };
    if (type === "recipe") {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        const toParse = jsonMatch ? jsonMatch[0] : generatedContent;
        const parsed = JSON.parse(toParse);
        
        result = {
          content: cleanRawJsonContent(parsed.content || toParse),
          prep_time: parseInt(parsed.prep_time) || 15,
          cook_time: parseInt(parsed.cook_time) || 15
        };
        if (parsed.title) result.title = parsed.title;
        if (parsed.tags && Array.isArray(parsed.tags)) result.tags = parsed.tags;
      } catch (e) {
        console.warn("Failed to parse JSON, cleaning raw as content:", e);
        result = { 
          content: cleanRawJsonContent(generatedContent), 
          prep_time: 15, 
          cook_time: 15 
        };
        const titleMatch = generatedContent.match(/"title"\s*:\s*"([^"]+)"/i);
        if (titleMatch && titleMatch[1]) {
          result.title = titleMatch[1];
        }
        const tagsMatch = generatedContent.match(/"tags"\s*:\s*\[([^\]]+)\]/i);
        if (tagsMatch && tagsMatch[1]) {
          try {
            const rawTags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
            if (rawTags.length > 0) result.tags = rawTags;
          } catch (_) {}
        }
      }
    }
    
    if (type === "grammar") {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        const toParse = jsonMatch ? jsonMatch[0] : generatedContent;
        result = JSON.parse(toParse);
      } catch (e) {
        console.warn("Failed to parse grammar JSON:", e);
        throw new Error("Grammar check failed to return valid JSON");
      }
    }

    return new Response(JSON.stringify(result), {
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
