// POST /api/ads-generate — Admin > Ads "Generate ad" for one product.
// Auth: admins only (requireAdmin). Returns the product's break-even maths, a suggested budget and
// stop rule, and three ad copy variants (Gemini, grounded in the marketing knowledge base; falls
// back to copy built from the product's own details when Gemini is unavailable).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAdmin } from "./_require-admin.js";
import { getMarketingContext } from "./_marketing-context.js";
import { toPlainText } from "./_product-copy.js";
import { adCopyPrompt, breakEven, DEFAULT_DAILY_BUDGET_CENTS, parseCopyVariants, SITE_URL, templateCopy, type AdCopy } from "./_ads.js";

const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const denied = await requireAdmin(req);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  const productId = Number(req.body?.product_id);
  if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ error: "Choose a product." });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });

  const { data: product, error } = await db
    .from("products")
    .select("id, title, slug, price, image_url, excerpt, content, status, vendor_id")
    .eq("id", productId)
    .maybeSingle();
  if (error || !product) return res.status(404).json({ error: "Product not found." });
  if (product.status !== "published") return res.status(400).json({ error: "Only published products can be advertised." });

  const { data: vendor } = await db
    .from("vendor_profiles")
    .select("store_name, commission_rate")
    .eq("id", product.vendor_id)
    .maybeSingle();

  const priceCents = Math.round(Number(product.price) * 100);
  const maths = breakEven(priceCents, vendor?.commission_rate);
  const description = toPlainText(String(product.excerpt || product.content || "").replace(/<[^>]+>/g, " ")).slice(0, 1500);
  const adProduct = {
    title: product.title,
    priceCents,
    vendorName: vendor?.store_name || "an Australian brand",
    description,
    url: `${SITE_URL}/products/${product.slug}`,
  };

  let variants: AdCopy[] = [];
  let source: "ai" | "template" = "template";
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const prompt = adCopyPrompt(adProduct, getMarketingContext());
    for (const name of MODELS) {
      try {
        const out = await genAI.getGenerativeModel({ model: name }).generateContent(prompt);
        variants = parseCopyVariants(out.response.text());
        if (variants.length > 0) {
          source = "ai";
          break;
        }
      } catch (err: any) {
        console.error(`ads-generate: ${name} failed:`, String(err?.message ?? err).slice(0, 200));
      }
    }
  }
  if (variants.length === 0) variants = templateCopy(adProduct);

  return res.status(200).json({
    product: {
      id: product.id,
      title: product.title,
      vendor_id: product.vendor_id,
      vendor_name: adProduct.vendorName,
      price_cents: priceCents,
      image_url: product.image_url,
      link_url: adProduct.url,
    },
    commission_rate: vendor?.commission_rate ?? null,
    break_even: maths,
    suggested_daily_budget_cents: DEFAULT_DAILY_BUDGET_CENTS,
    variants,
    source,
  });
}
