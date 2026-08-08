import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.query;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const cleanImagePrompt = encodeURIComponent(prompt);
    // Add a random seed to bust any bad caches on pollinations side
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanImagePrompt}?width=1080&height=1080&nologo=true&seed=${seed}`;

    const imageRes = await fetch(pollinationsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!imageRes.ok) throw new Error("Failed to generate image from Pollinations AI");

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache on Vercel Edge Network for 1 year so Buffer's fetch is instant if UI already loaded it
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, s-maxage=31536000, max-age=31536000, stale-while-revalidate");
    
    return res.status(200).send(buffer);
  } catch (err: any) {
    console.error("Error generating viral image via proxy:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
