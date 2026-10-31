// Pure decision logic for the Shopify catalogue import and the daily stock sync. No network, no
// database and no Deno APIs, so Vitest can test it (src/lib/__tests__/shopify-import.test.ts).
// The import-shopify-catalogue Edge Function does the fetching and writing around it.

export interface ShopifyVariant {
  id: number | string;
  title?: string;
  price?: string | number;
  available?: boolean;
}

export interface ShopifyImage {
  id?: number;
  src: string;
  variant_ids?: Array<number | string>;
}

export interface ShopifyProduct {
  id: number | string;
  title?: string;
  handle?: string;
  body_html?: string | null;
  vendor?: string;
  product_type?: string;
  tags?: string | string[];
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

export interface LmgVariant {
  id: string;
  title?: string;
  price?: number;
  stock?: number;
  available?: boolean;
  /** Set only on variants the import created; the sync matches on it. */
  source_ref?: string;
  [key: string]: unknown;
}

export interface ProductDraft {
  title: string;
  slug: string;
  content: string;
  price: number;
  stock: number;
  brand: string | null;
  category: string;
  tags: string[];
  variants: LmgVariant[];
  source_platform: "shopify";
  source_ref: string;
}

/** The category an imported product starts in; the admin corrects it while reviewing the draft. */
export const DEFAULT_CATEGORY = "Health & Beauty";

/**
 * The sanitize-html options used on imported descriptions. Shared so the Edge Function and its
 * tests run the same rules. (The function adds a rel="noopener noreferrer" transform on links.)
 */
export const SANITIZE_OPTIONS = {
  allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "span", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

const IMAGE_HOSTS = new Set(["cdn.shopify.com"]);
const INTERNAL_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp", ".intranet"];

export type StoreUrlResult = { ok: true; origin: string } | { ok: false; reason: string };

/**
 * Turns whatever the admin typed into a safe store origin, or says why not. The server fetches
 * this address, so it must be a public https hostname with nothing else attached (no credentials,
 * port, path or IP literal). See docs/DEVELOPMENT_STANDARDS.md section 2.
 */
export function parseStoreUrl(input: string): StoreUrlResult {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, reason: "Enter the vendor's Shopify store address." };
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    return { ok: false, reason: "The store address must start with https://." };
  }
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, reason: "That doesn't look like a web address." };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "The store address must use https." };
  if (url.username || url.password) return { ok: false, reason: "The store address can't contain a login." };
  if (url.port) return { ok: false, reason: "The store address can't include a port." };
  if (url.pathname !== "/" && url.pathname !== "") return { ok: false, reason: "Enter just the store's address, with no page path." };

  const host = url.hostname.toLowerCase();
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[") || host.includes(":");
  if (isIp) return { ok: false, reason: "Use the store's web address, not an IP address." };
  if (host === "localhost" || !host.includes(".") || INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "That address isn't a public website." };
  }
  return { ok: true, origin: `https://${host}` };
}

/**
 * Stores often redirect their bare domain to www (or back). That is the only redirect followed:
 * https, and the same name with or without a leading "www.". Anything else is refused.
 */
export function isSameSiteRedirect(fromHost: string, location: string, base: string): boolean {
  try {
    const to = new URL(location, base);
    if (to.protocol !== "https:" || to.username || to.password || to.port) return false;
    const strip = (h: string) => h.toLowerCase().replace(/^www\./, "");
    return strip(to.hostname) === strip(fromHost);
  } catch {
    return false;
  }
}

/** The only page ever requested from a store. */
export function feedUrl(origin: string, page: number): string {
  return `${origin}/products.json?limit=250&page=${page}`;
}

/** Images are only copied from Shopify's CDN, over https. */
export function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password && IMAGE_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

const IMG_SRC = /(<img\b[^>]*?\bsrc=)(["'])(.*?)\2/gi;

function descriptionImageUrls(html: string): string[] {
  return Array.from(html.matchAll(IMG_SRC), (m) => m[3]);
}

/** Every image a product needs copied: product and variant images, then those in the description. */
export function collectImageUrls(p: ShopifyProduct): string[] {
  const urls = [...(p.images ?? []).map((i) => i.src), ...descriptionImageUrls(p.body_html ?? "")];
  return Array.from(new Set(urls.filter(Boolean)));
}

/** Replaces each description image that has a copy; images without one are left for the caller to flag. */
export function rewriteImages(html: string, copies: Record<string, string>): string {
  return html.replace(IMG_SRC, (whole, head: string, quote: string, src: string) =>
    copies[src] ? `${head}${quote}${copies[src]}${quote}` : whole,
  );
}

export function slugFor(title: string, ref: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return base ? `${base}-${ref}` : `product-${ref}`;
}

export type MapResult = { ok: true; draft: ProductDraft } | { ok: false; name: string; reason: string };

export interface MapOptions {
  /** Quantity every imported variant starts with; the store's feed only says in or out of stock. */
  startingQuantity: number;
  /** The caller's HTML sanitiser (the Edge Function passes sanitize-html). */
  sanitize: (html: string) => string;
}

/** Maps one Shopify product to an LMG draft, or says why it can't be imported. */
export function mapProduct(p: ShopifyProduct, opts: MapOptions): MapResult {
  const title = String(p.title ?? "").trim();
  const name = title || `Product ${p.id}`;
  if (!title) return { ok: false, name, reason: "It has no title." };
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(String(p.id))) return { ok: false, name, reason: "It has an unexpected id." };
  const source = p.variants ?? [];
  if (source.length === 0) return { ok: false, name, reason: "It has no variants." };

  // A variant without a usable price can't be bought, so it isn't imported.
  const variants: LmgVariant[] = source
    .map((v) => ({
      id: String(v.id),
      source_ref: String(v.id),
      title: String(v.title ?? "Default Title"),
      price: Number(v.price),
      stock: opts.startingQuantity,
      available: v.available !== false,
    }))
    .filter((v) => Number.isFinite(v.price) && v.price > 0);
  if (variants.length === 0) return { ok: false, name, reason: "It has no usable price." };
  const prices = variants.map((v) => v.price as number);

  const tags = Array.isArray(p.tags) ? p.tags : String(p.tags ?? "").split(",");
  const ref = String(p.id);
  return {
    ok: true,
    draft: {
      title,
      slug: slugFor(title, ref),
      content: opts.sanitize(p.body_html ?? ""),
      price: Math.min(...prices),
      stock: variants.some((v) => v.available) ? opts.startingQuantity : 0,
      brand: p.vendor?.trim() || null,
      category: DEFAULT_CATEGORY,
      tags: tags.map((t) => t.trim()).filter(Boolean),
      variants,
      source_platform: "shopify",
      source_ref: ref,
    },
  };
}

/**
 * The daily stock sync for one product: set each imported variant's `available` flag from the
 * store, and change nothing else. A product no longer in the store (feedProduct undefined), or a
 * variant missing from it, becomes unavailable. Variants without a `source_ref` were not imported
 * and are never touched.
 */
export function mergeAvailability(
  variants: LmgVariant[],
  feedProduct: ShopifyProduct | undefined,
): { variants: LmgVariant[]; changed: boolean } {
  const inStock = new Map<string, boolean>();
  for (const v of feedProduct?.variants ?? []) inStock.set(String(v.id), v.available !== false);

  let changed = false;
  const next = variants.map((v) => {
    if (!v.source_ref) return v;
    const available = inStock.get(v.source_ref) ?? false;
    if (v.available === available) return v;
    changed = true;
    return { ...v, available };
  });
  return { variants: next, changed };
}

export interface ExistingImport {
  import_issue?: string | null;
}

/**
 * What a re-import does with a product it has seen before. New products are always inserted as
 * drafts; an existing product is never touched (so edits survive) unless it is flagged, in which
 * case only its images are retried.
 */
export function planImport(existing: ExistingImport | null): { action: "insert" | "skip" | "retry"; status: "draft" } {
  if (!existing) return { action: "insert", status: "draft" };
  return { action: existing.import_issue ? "retry" : "skip", status: "draft" };
}

export interface ImportTotals {
  imported: number;
  existing: number;
  retried: number;
  flagged: Array<{ name: string; issue: string }>;
  skipped: Array<{ name: string; reason: string }>;
}

/** Longest list of flagged / skipped products kept in the running summary. */
export const MAX_LISTED = 200;

/** Adds one batch's result to the totals so far (which a background import carries from batch to batch). */
export function mergeImportTotals(prev: Partial<ImportTotals> | null | undefined, batch: ImportTotals): ImportTotals {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const list = <T,>(a: unknown, b: T[]): T[] => [...(Array.isArray(a) ? (a as T[]) : []), ...b].slice(0, MAX_LISTED);
  return {
    imported: n(prev?.imported) + batch.imported,
    existing: n(prev?.existing) + batch.existing,
    retried: n(prev?.retried) + batch.retried,
    flagged: list(prev?.flagged, batch.flagged),
    skipped: list(prev?.skipped, batch.skipped),
  };
}

/** A running import that has made no progress for this long counts as stalled and can be restarted. */
export const IMPORT_STALL_MS = 10 * 60 * 1000;

export function isImportRunning(status: string | null | undefined, updatedAt: string | null | undefined, now = Date.now()): boolean {
  if (status !== "running") return false;
  const t = updatedAt ? new Date(updatedAt).getTime() : 0;
  return now - t < IMPORT_STALL_MS;
}
