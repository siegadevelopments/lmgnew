import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Best-effort per-instance rate limit (serverless instances are ephemeral, so this only blunts
// bursts; put Vercel Firewall / Upstash in front for hard limits).
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  return ++entry.count > MAX_PER_WINDOW;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.lifestylemedicinegateway.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
    if (rateLimited(ip)) return res.status(429).json({ error: "Too many requests" });

    const { content, vendor_id } = req.body ?? {};
    if (typeof content !== "string" || !content.trim() || content.length > 500) {
      return res.status(400).json({ error: "Invalid message" });
    }
    if (vendor_id !== undefined && vendor_id !== null && (typeof vendor_id !== "string" || !UUID_RE.test(vendor_id))) {
      return res.status(400).json({ error: "Invalid vendor" });
    }
    const lowerContent = content.toLowerCase();

    // Public endpoint: use the publishable key so RLS applies (the service-role key would also
    // expose drafts and unpublished content).
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    );

    let contextName = "the Marketplace";
    let productsQuery = supabase
      .from("products")
      .select("id, title, price, slug, excerpt")
      .eq("status", "published");

    if (vendor_id) {
      const { data: vendor } = await supabase
        .from("vendor_profiles")
        .select("store_name")
        .eq("id", vendor_id)
        .single();
      if (vendor) {
        contextName = vendor.store_name;
        productsQuery = productsQuery.eq("vendor_id", vendor_id);
      }
    }

    const [articlesRes, productsRes, recipesRes] = await Promise.all([
      supabase.from("articles").select("id, title, slug, excerpt").limit(250),
      productsQuery.limit(250),
      supabase.from("recipes").select("id, title, slug, excerpt").limit(250),
    ]);

    const allArticles = articlesRes.data || [];
    const allProducts = productsRes.data || [];
    const allRecipes = recipesRes.data || [];

    const STOP_WORDS = new Set([
      "can",
      "you",
      "me",
      "tell",
      "about",
      "the",
      "and",
      "for",
      "with",
      "your",
      "this",
      "that",
      "have",
      "from",
      "some",
      "what",
      "there",
      "here",
      "when",
      "where",
      "how",
      "who",
      "why",
      "meant",
      "mean",
      "want",
      "look",
      "find",
      "show",
      "give",
      "tell",
      "need",
      "help",
      "search",
      "find",
      "think",
      "thought",
      "like",
      "does",
      "did",
      "was",
      "were",
      "been",
      "being",
      "information",
      "info",
      "products",
      "product",
      "items",
      "item",
      "articles",
      "article",
      "tips",
      "tip",
      "details",
      "detail",
      "guide",
      "guides",
      "website",
      "site",
      "more",
      "most",
      "each",
      "every",
      "all",
      "any",
      "some",
      "than",
      "then",
      "also",
      "just",
      "only",
      "very",
      "really",
      "would",
      "could",
      "should",
      "shall",
      "will",
      "must",
      "please",
      "thanks",
      "thank",
      "hello",
      "hi",
      "hey",
      "greetings",
      "welcome",
      "anyone",
      "someone",
      "everything",
      "anything",
      "nothing",
      "something",
    ]);

    const queryWords = lowerContent
      .split(/\s+/)
      .map((w: string) => w.replace(/[^a-z0-9]/g, ""))
      .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

    if (queryWords.length === 0) {
      return res
        .status(200)
        .json({
          response: `Hello! I'm your wellness guide for ${contextName}. How can I help you today?`,
        });
    }

    // 1. PHRASE DETECTION (e.g. "lifestyle medicine gateway")
    const searchPhrase = queryWords.join(" ");

    // 2. WEIGHTED MULTI-WORD SEARCH
    const findMatches = (list: any[]) => {
      return list
        .map((item) => {
          const title = (item.title || "").toLowerCase();
          const body = (item.excerpt || item.content || "").toLowerCase().replace(/<[^>]*>?/gm, "");
          const slug = (item.slug || "").toLowerCase();
          const combined = `${title} ${slug} ${body}`;

          let score = 0;

          // Exact Phrase match (ULTRA BOOST)
          if (title.includes(searchPhrase)) score += 50;
          else if (combined.includes(searchPhrase)) score += 20;

          // Individual word matches
          queryWords.forEach((word: string) => {
            const regex = new RegExp(`\\b${word}\\b`, "i");
            if (regex.test(title)) score += 10;
            else if (regex.test(slug)) score += 5;
            else if (body.includes(word)) score += 1;
          });

          return { ...item, score, cleanExcerpt: body };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
    };

    const articleMatches = findMatches(allArticles).slice(0, 3);
    const productMatches = findMatches(allProducts).slice(0, 3);
    const recipeMatches = findMatches(allRecipes).slice(0, 3);

    // 3. RESPONSE SYNTHESIS
    let responseText = "";

    if (articleMatches.length > 0 || productMatches.length > 0 || recipeMatches.length > 0) {
      // Use the full search phrase for the header
      const displayTopic = searchPhrase
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      responseText = `I've found some relevant wellness resources regarding **${displayTopic}**:`;

      if (articleMatches.length > 0) {
        responseText +=
          `\n\n**📖 Expert Articles:**` +
          articleMatches
            .map(
              (a) =>
                `\n\n- [**${a.title}**](/articles/${a.slug})\n  _${a.cleanExcerpt ? a.cleanExcerpt.substring(0, 100) + "..." : "Learn more about this topic."}_`,
            )
            .join("");
      }

      if (recipeMatches.length > 0) {
        responseText +=
          `\n\n**🍳 Wellness Recipes:**` +
          recipeMatches
            .map(
              (r) =>
                `\n\n- [**${r.title}**](/recipes/${r.slug})\n  _${r.cleanExcerpt ? r.cleanExcerpt.substring(0, 100) + "..." : "View the full recipe."}_`,
            )
            .join("");
      }

      if (productMatches.length > 0) {
        responseText +=
          `\n\n**🛒 Recommended for you:**` +
          productMatches.map((p) => `\n- **[PRODUCT:${p.id}]**`).join("");
      }

      responseText += `\n\nIs there anything specific about **${displayTopic}** you'd like to explore further?`;
    } else {
      responseText = `I couldn't find a direct match for "**${searchPhrase}**" at ${contextName} right now. \n\nFeel free to try broader terms or browse our latest wellness content!`;
    }

    return res.status(200).json({ response: responseText });
  } catch (error: any) {
    console.error("ai-chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
