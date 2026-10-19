/**
 * Product-first prompts for the admin Marketing tab's per-field AI buttons
 * (title / caption / hashtags) when the admin has picked marketplace products.
 *
 * Previously the products were appended to a generic "write a caption for a
 * wellness brand" task as loose context, and Gemini consistently ignored them
 * and wrote general wellness copy. Here the product IS the task.
 */

export type CopyProduct = { title: string; url: string; description: string };
export type CopyFramework = "AIDA" | "PAS";
export type CopyField = "title" | "caption" | "hashtags";

const GENERIC_WORDS = new Set(["pack", "with", "and", "white", "black", "large", "small", "size", "set", "the"]);

export function sanitizeProducts(input: unknown): CopyProduct[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 5)
    .map((p: any) => ({
      title: String(p?.title ?? "").replace(/<[^>]*>/g, " ").trim().slice(0, 200),
      url: /^https:\/\/www\.lifestylemedicinegateway\.com\/products\/[\w-]+$/.test(String(p?.url ?? "")) ? String(p.url) : "",
      description: String(p?.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000),
    }))
    .filter((p) => p.title);
}

export function parseFramework(input: unknown): CopyFramework | null {
  return input === "PAS" || input === "AIDA" ? input : null;
}

/** Distinctive words from the product names, used to check the AI actually wrote about them. */
export function productKeywords(products: CopyProduct[]): string[] {
  return products.flatMap((p) =>
    p.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w)),
  );
}

export function mentionsProduct(text: string, products: CopyProduct[]): boolean {
  const t = text.toLowerCase();
  const words = productKeywords(products);
  return words.length === 0 || words.some((w) => t.includes(w));
}

const FRAMEWORK_STEPS: Record<CopyFramework, string> = {
  AIDA: "AIDA — ATTENTION (scroll-stopping first line about a real situation where this product helps), INTEREST (a relatable detail or insight), DESIRE (concrete benefits of this product in daily life, only those supported by the description), ACTION (one clear call to action with the product link)",
  PAS: "PAS — PROBLEM (a specific, relatable everyday frustration this product addresses), AGITATE (why it matters, empathetically, never fear-mongering), SOLUTION (this product as a practical answer, with the product link)",
};

export function buildProductPrompt(opts: {
  brandContext: string;
  field: CopyField;
  products: CopyProduct[];
  framework: CopyFramework | null;
  currentValue?: string;
}): string {
  const { brandContext, field, products, framework, currentValue } = opts;
  const productList = products
    .map((p) => `- Name: ${p.title}\n  Link: ${p.url || "(no link)"}\n  Description: ${p.description || "(none provided — rely on the name only, do not invent features)"}`)
    .join("\n");

  const fieldRules: Record<CopyField, string> = {
    title: "Write ONE short social media post title (under 10 words) that names the product or its main everyday benefit.",
    caption: `Write ONE social media caption (120-200 words) that SELLS THIS PRODUCT.
- Name the product within the first two lines.
- Structure: ${FRAMEWORK_STEPS[framework ?? "AIDA"]}.
- End with a call to action that includes the exact product link above.
- Short sentences, line breaks between ideas, talk to "you", warm and credible.
- Do NOT include hashtags (they have their own field).`,
    hashtags: "Generate 5-6 hashtags relevant to THIS product and its use (mix broad and niche, include one Australian-specific tag). Return ONLY a comma-separated list like: #Tag1, #Tag2",
  };

  return `${brandContext}

=== TASK (this overrides any general topic guidance above) ===
This is a PRODUCT post for the LMG marketplace. It must be about the product(s) below — not general wellness, habits or lifestyle-medicine advice.

PRODUCT(S):
${productList}

${fieldRules[field]}
${currentValue ? `\nCurrent draft (improve it, but keep it about the product; drop anything unrelated):\n"${currentValue}"\n` : ""}
Rules: Plain text only — no Markdown (no **bold**, *italics*, # headings or bullet asterisks); emojis and line breaks are fine. Refer to the product naturally (e.g. "these microfibre cloths") rather than repeating its full catalogue name with colours and pack size. Australian English. Use only facts in the product description; never invent features, prices, statistics or testimonials. Wellness language only ("may help", "can be part of") — never claim to cure, treat or prevent disease. Never output placeholders like "[Insert URL here]".
Return ONLY the ${field} text, nothing else.`;
}

/**
 * Social platforms render Markdown literally, so "**Product**" shows the
 * asterisks in the post. Strip bold/italic/heading markers but keep hashtags.
 */
export function toPlainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/__(.+?)__/gs, "$1")
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*-]\s+/gm, "• ");
}
