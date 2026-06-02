import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Auth
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

    // 2. Get request
    const { field, value, context } = req.body;
    if (!field) return res.status(400).json({ error: "field is required" });

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const genAI = new GoogleGenerativeAI(geminiKey);

    const BRAND_CONTEXT = `You are writing for "Lifestyle Medicine Gateway", an Australian wellness marketplace.
TARGET AUDIENCE: Women aged 40–65 going through menopause/perimenopause. Also partners/daughters who want to help.
BRAND VOICE: Warm, supportive, empowering but realistic. Australian English. Science-backed but relatable. 2-4 emojis max.
NEVER use aggressive sales language, medical jargon, or hype.`;

    let prompt = "";

    switch (field) {
      case "title":
        prompt = `${BRAND_CONTEXT}

${
  value
    ? `Improve this social media post title to be more engaging and click-worthy. Keep it short (under 10 words).
Current title: "${value}"
${context ? `Context: ${context}` : ""}`
    : `Generate a catchy, engaging social media post title for a wellness brand. Keep it short (under 10 words).
${context ? `Topic/context: ${context}` : "Topic: general wellness or menopause support"}`
}

Return ONLY the improved title text, nothing else.`;
        break;

      case "caption":
        prompt = `${BRAND_CONTEXT}

${
  value
    ? `Rewrite and improve this social media post caption to be more engaging, with a compelling hook, clear value, and a call-to-action (CTA). Keep it 150-250 words. Use line breaks for readability.
If a Link/URL is provided in the context, integrate it directly as the target of the call-to-action (CTA) at the end of the caption (e.g. 'Read more here: [URL]').
Current caption: "${value}"
${context ? `Context: ${context}` : ""}`
    : `Write a compelling social media post caption for a wellness brand. Include:
- A strong opening hook
- Valuable insight or tip
- A warm call-to-action (CTA)
If a Link/URL is provided in the context, integrate it directly as the target of the call-to-action (CTA) at the end of the caption (e.g. 'Read more here: [URL]').
Keep it 150-250 words. Use line breaks for readability.
${context ? `Topic/Context: ${context}` : "Topic: general wellness, menopause support, or natural health"}`
}

Return ONLY the caption text, nothing else.`;
        break;

      case "hashtags":
        prompt = `${BRAND_CONTEXT}

Generate 5-6 relevant hashtags for a social media post about wellness/menopause/natural health.
${value ? `Current hashtags: ${value}` : ""}
${context ? `Post topic: ${context}` : ""}

Mix broad reach hashtags with niche ones. Include at least one Australian-specific tag.
Return ONLY a comma-separated list of hashtags like: #Tag1, #Tag2, #Tag3`;
        break;

      case "custom":
        prompt = value;
        break;

      default:
        return res.status(400).json({ error: "Unknown field type" });
    }

    // Try models with fallback
    const MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    let result = "";
    const modelErrors: Record<string, string> = {};

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(prompt);
        result = response.response.text().trim();
        // Clean up any markdown wrapping
        result = result
          .replace(/^["']|["']$/g, "")
          .replace(/^```[\s\S]*?\n|```$/g, "")
          .trim();
        break;
      } catch (err: any) {
        const errMsg = err.message || "Unknown error";
        modelErrors[modelName] = errMsg;
        console.error(`Model ${modelName} failed:`, errMsg);
        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("Too Many Requests")
        ) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (!result) {
      const isQuotaError = Object.values(modelErrors).some(
        (e) => e.includes("quota") || e.includes("429") || e.includes("Too Many Requests")
      );
      const combinedDetails = Object.entries(modelErrors)
        .map(([m, e]) => `${m}: ${e}`)
        .join(" | ");
      return res.status(429).json({
        error: isQuotaError ? "AI Rate Limit Reached" : "AI Enhancement Failed",
        details: combinedDetails,
        suggestion: isQuotaError
          ? "The AI is currently busy. Please wait 30 seconds and try again."
          : "Please check your connection and try again.",
      });
    }

    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("AI enhance error:", error);
    return res.status(500).json({ error: error.message });
  }
}
