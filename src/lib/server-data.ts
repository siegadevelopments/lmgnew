// Server-side data access for SEO-critical pages (categories, guides, vendors, homepage, products).
//
// Why this exists: the browser Supabase client (src/integrations/supabase/client.ts) is only used
// from React Query hooks, and React Query never fetches during SSR — so the server HTML used to
// ship skeletons and "—" placeholders instead of real content. These helpers fetch the same
// public data on the server, anonymously (publishable key + RLS, never the service-role key —
// see docs/DEVELOPMENT_STANDARDS.md §2) so crawlers see it without running JavaScript.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { globalMockProductsList } from "@/lib/queries"; // homepage fallback only
import { categoriesWithProducts, productInCategory } from "@/lib/wellness-categories";
import { isTradeListing, retailOnly } from "@/lib/trade";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstValidUrl(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c);
      if (u.protocol === "https:" || u.protocol === "http:") return c;
    } catch {
      // not a URL (e.g. an empty or placeholder env value) — try the next candidate
    }
  }
  return undefined;
}

let cached: SupabaseClient | null | undefined;

/**
 * Anonymous, session-less Supabase client for server rendering. Returns null when no usable
 * credentials are configured so callers can degrade gracefully (the client-side queries still work).
 * Falls back to the non-prefixed names Vercel's Supabase integration provides.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = firstValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = [process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.SUPABASE_PUBLISHABLE_KEY].find(
    (k) => !!k && k.length > 20,
  );
  cached = url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: fetchWithTimeout },
        // withRetry below is the single retry layer. postgrest-js's own retry (503/520 only) would
        // multiply with it, and it also retries our timeout aborts, so a hung database could hold
        // one render for minutes.
        db: { retry: false },
      })
    : null;
  if (!cached) console.error("server-data: no usable Supabase URL/key configured; SSR data disabled");
  return cached;
}

function requireClient(): SupabaseClient {
  const client = getServerSupabase();
  if (!client) throw new ServerDataError("Supabase is not configured on the server");
  return client;
}

// ---------------------------------------------------------------------------------------------
// Reliability: timeouts, retries, logging
//
// A failed fetch must never look like "no data". Callers render notFound() only for records that
// genuinely don't exist; when the database can't be reached these helpers throw, so the route
// errors (5xx) and ISR keeps serving the last good version instead of caching a broken page.
// ---------------------------------------------------------------------------------------------

/** Thrown when server-side data could not be loaded after all retries. */
export class ServerDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ServerDataError";
  }
}

export const REQUEST_TIMEOUT_MS = 8000;
export const RETRY_DELAYS_MS = [300, 1000]; // 3 attempts in total

export const DATA_REVALIDATE_SECONDS = 3600;

/**
 * Aborts a hung Supabase request instead of letting it hold the render until the platform kills it.
 *
 * `next.revalidate` caps how long Next's data cache keeps a response. Without it the response was
 * cached for the page's own hour, so a page refreshing on schedule could still render data up to
 * an hour old (two hours end to end). Pages that show this data set `revalidate = 3600` to match,
 * so admin edits show within about two hours at worst (raised from 5 minutes to cut Vercel Active CPU). (Set it on the route explicitly: a page that reuses
 * a shared result below makes no fetch of its own, so the fetch setting alone doesn't reach it.)
 * (`cache: "no-store"` is not an option: it turns every ISR route back into dynamic rendering.)
 * Only 200 responses are ever stored, so a failure is never cached.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal, next: { revalidate: DATA_REVALIDATE_SECONDS } } as RequestInit);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: string; name?: string };
    return [e.name, e.code, e.message].filter(Boolean).join(" ") || String(err);
  }
  return String(err);
}

/**
 * Runs a Supabase query with retries. `run` must build a fresh query each call. Supabase returns
 * errors (network failures included) as `{ error }` rather than throwing, so both are handled.
 */
export async function withRetry<T>(
  label: string,
  run: () => PromiseLike<{ data: T | null; error: unknown }>,
  delays: number[] = RETRY_DELAYS_MS,
): Promise<T | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const { data, error } = await run();
      if (!error) {
        if (attempt > 0) console.warn(`server-data: ${label} succeeded on attempt ${attempt + 1}`);
        return data;
      }
      lastError = error;
    } catch (err) {
      lastError = err;
    }
    console.error(
      `server-data: ${label} failed (attempt ${attempt + 1}/${delays.length + 1}): ${describeError(lastError)}`,
    );
    if (attempt < delays.length) await sleep(delays[attempt]);
  }
  throw new ServerDataError(`${label} failed after ${delays.length + 1} attempts`, { cause: lastError });
}

/**
 * Shares one successful result across renders in the same server instance for a short time, so a
 * build or crawler burst rendering many pages doesn't fire the same query dozens of times. Only
 * successes are kept; a failure clears the entry so the next render tries again.
 */
const SHARED_TTL_MS = 60_000;
const shared = new Map<string, { at: number; value: Promise<unknown> }>();

function sharedResult<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = shared.get(key);
  if (hit && Date.now() - hit.at < SHARED_TTL_MS) return hit.value as Promise<T>;
  const value = load().catch((err) => {
    if (shared.get(key)?.value === value) shared.delete(key);
    throw err;
  });
  shared.set(key, { at: Date.now(), value });
  return value;
}

/** Test hook: clears the shared result cache. */
export function clearSharedResults() {
  shared.clear();
}

// ---------------------------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------------------------

function fetchLiveProducts(): Promise<any[]> {
  return sharedResult("live-products", async () => {
    const data = await withRetry("live products", () =>
      requireClient()
        .from("products")
        .select(`*, vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)`)
        .eq("status", "published")
        .eq("vendor_profiles.is_approved", true)
        .eq("vendor_profiles.is_live", true)
        .neq("product_type", "service"),
    );
    return retailOnly((data as any[]) || []); // trade listings live on /trade
  });
}

/**
 * Products for /categories/[slug]: by wellness_categories once set, keyword matching until then.
 * Throws ServerDataError when the database can't be reached.
 */
export async function getCategoryProducts(categorySlug: string, keywords: string[]) {
  return (await fetchLiveProducts()).filter((p: any) => productInCategory(p, categorySlug, keywords));
}

/** Products for /guides/[slug] (the guide's category); the guide shows at most six. */
export async function getGuideProducts(categorySlug: string, keywords: string[]) {
  return (await getCategoryProducts(categorySlug, keywords)).slice(0, 6);
}

/**
 * Category slugs that currently have at least one product. Empty categories are left out of the
 * category list, the homepage grid and the sitemap. Throws ServerDataError on failure.
 */
export async function getNonEmptyCategorySlugs(): Promise<string[]> {
  return categoriesWithProducts(await fetchLiveProducts());
}

const LISTING_COLUMNS = `id, vendor_id, title, slug, excerpt, price, image_url, stock, status, created_at, category, product_type, variants,
       vendor_profiles (store_name, store_logo_url, is_approved, is_live)`;

/** Published products from approved, live vendors — the same rule productsQueryOptions applies. */
function fetchListingProducts(): Promise<any[]> {
  return sharedResult("listing-products", async () => {
    const data = await withRetry("product listing", () =>
      requireClient().from("products").select(LISTING_COLUMNS).eq("status", "published"),
    );
    return ((data as any[]) || []).filter(
      (p: any) => !p.vendor_profiles || (p.vendor_profiles.is_approved !== false && p.vendor_profiles.is_live !== false),
    );
  });
}

/** Retail listing (products page, new arrivals): trade listings live on /trade. */
const fetchRetailListingProducts = async () => retailOnly(await fetchListingProducts());

/** /trade: trade listings from approved, live stores, grouped by store name. */
export async function getTradeProducts(): Promise<Record<string, any[]>> {
  const products = (await fetchListingProducts()).filter((p: any) => isTradeListing(p.title) && p.product_type !== "service");
  const byStore: Record<string, any[]> = {};
  for (const p of products) {
    const store = p.vendor_profiles?.store_name ?? "Other";
    (byStore[store] ??= []).push(p);
  }
  return byStore;
}

/**
 * /products listing, newest first. A stable order keeps the server HTML and the first client
 * render identical; the page applies its interactive sort after hydration.
 */
export async function getProductListing() {
  return [...(await fetchRetailListingProducts())].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Homepage "New arrivals" — mirrors productsQueryOptions (published, approved vendor, shuffled). */
export async function getNewArrivals(limit = 5) {
  const live = await fetchRetailListingProducts();
  const pool = live.length > 0 ? live : [...globalMockProductsList];
  return pool.sort(() => Math.random() - 0.5).slice(0, limit);
}

/** Single product by slug, same selection + approved-vendor rule as productBySlugQueryOptionsV2. */
export async function getProductBySlug(slug: string) {
  const data = (await withRetry(`product ${slug}`, () =>
    requireClient()
      .from("products")
      .select(`*, vendor_profiles (id, store_name, store_logo_url, store_slug, is_approved, is_live)`)
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1),
  )) as any[] | null;
  if (!data || data.length === 0) return [];
  const filtered = data.filter(
    (p: any) => !p.vendor_profiles || (p.vendor_profiles.is_approved !== false && p.vendor_profiles.is_live !== false),
  );
  // Same behaviour as the client query: a published product's direct URL always resolves.
  return filtered.length > 0 ? filtered : data;
}

// ---------------------------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------------------------

/** Approved vendors for /vendors and the homepage — mirrors brandsQueryOptions. */
export async function getApprovedVendors() {
  const data = await withRetry("approved vendors", () =>
    requireClient()
      .from("vendor_profiles")
      .select("id, store_name, store_description, store_logo_url, store_slug, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(100),
  );
  return (data || []) as any[];
}

const VENDOR_COLUMNS =
  "id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, vendor_type, created_at, updated_at, store_categories, store_slug";

/** Vendor by store_slug, falling back to UUID (legacy URLs). Returns null when not found. */
export async function getVendorBySlug(slug: string) {
  const column = UUID_RE.test(slug) ? "id" : "store_slug";
  const data = await withRetry(`vendor ${slug}`, () =>
    requireClient().from("vendor_profiles").select(VENDOR_COLUMNS).eq(column, slug).maybeSingle(),
  );
  return (data as any) ?? null;
}

export async function getVendorProducts(vendorId: string) {
  const data = await withRetry(`vendor products ${vendorId}`, () =>
    requireClient().from("products").select("*").eq("vendor_id", vendorId).eq("status", "published"),
  );
  return (data as any[]) || [];
}

// ---------------------------------------------------------------------------------------------
// Homepage trust counters
// ---------------------------------------------------------------------------------------------

export async function getTrustStats() {
  const client = requireClient();
  const [vendorsRes, productsRes, reviewsRes] = await Promise.all([
    client.from("vendor_profiles").select("id", { count: "exact", head: true }).eq("is_approved", true).eq("is_live", true),
    client.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
    client.from("reviews").select("rating"),
  ]);
  const reviews = reviewsRes.data || [];
  return {
    vendors: vendorsRes.count || 0,
    products: productsRes.count || 0,
    rating:
      reviews.length > 0
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "5.0",
    reviewCount: reviews.length,
  };
}

// ---------------------------------------------------------------------------------------------
// Articles and recipes (for the "shop for this goal" block)
// ---------------------------------------------------------------------------------------------

/** Title, excerpt and content of an article or recipe by slug; null when not found. */
export async function getContentForGoal(table: "articles" | "recipes", slug: string) {
  const data = await withRetry(`${table} ${slug}`, () =>
    requireClient().from(table).select("title, excerpt, content").eq("slug", slug).limit(1),
  );
  return ((data as any[]) || [])[0] ?? null;
}
