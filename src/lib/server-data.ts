// Server-side data access for SEO-critical pages (categories, guides, vendors, homepage, products).
//
// Why this exists: the browser Supabase client (src/integrations/supabase/client.ts) is only used
// from React Query hooks, and React Query never fetches during SSR — so the server HTML used to
// ship skeletons and "—" placeholders instead of real content. These helpers fetch the same
// public data on the server, anonymously (publishable key + RLS, never the service-role key —
// see docs/DEVELOPMENT_STANDARDS.md §2) so crawlers see it without running JavaScript.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { globalMockProductsList } from "@/lib/queries";

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
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  if (!cached) console.error("server-data: no usable Supabase URL/key configured; SSR data disabled");
  return cached;
}

function requireClient(): SupabaseClient {
  const client = getServerSupabase();
  if (!client) throw new Error("Supabase is not configured on the server");
  return client;
}

// ---------------------------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------------------------

function matchesKeywords(p: any, keywords: string[]) {
  const searchText = `${p.title} ${p.category || ""} ${p.excerpt || ""}`.toLowerCase();
  return keywords.some((kw) => searchText.includes(kw.toLowerCase()));
}

function mockProductsFor(keywords: string[], idPrefix: string) {
  return globalMockProductsList
    .filter((m) => keywords.some((kw) => ((m as any).keywords || []).includes(kw.toLowerCase())))
    .map((m, i) => ({ ...m, id: `${idPrefix}-${i}`, slug: `mock-product-${idPrefix}-${i}` })) as any[];
}

async function fetchLiveProducts() {
  const { data, error } = await requireClient()
    .from("products")
    .select(`*, vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)`)
    .eq("status", "published")
    .eq("vendor_profiles.is_approved", true)
    .eq("vendor_profiles.is_live", true)
    .neq("product_type", "service");
  if (error) throw error;
  return data || [];
}

/** Products for /categories/[slug] — same keyword matching + mock fallback the client page used. */
export async function getCategoryProducts(slug: string, keywords: string[]) {
  const matched = (await fetchLiveProducts()).filter((p: any) => matchesKeywords(p, keywords));
  return matched.length > 0 ? matched : mockProductsFor(keywords, `mock-category-${slug}`);
}

/** Products for /guides/[slug]; the guide shows at most six recommendations. */
export async function getGuideProducts(slug: string, keywords: string[]) {
  const matched = (await fetchLiveProducts()).filter((p: any) => matchesKeywords(p, keywords)).slice(0, 6);
  return matched.length > 0 ? matched : mockProductsFor(keywords, `mock-guide-${slug}`).slice(0, 6);
}

/** Homepage "New arrivals" — mirrors productsQueryOptions (published, approved vendor, shuffled). */
export async function getNewArrivals(limit = 5) {
  const { data, error } = await requireClient()
    .from("products")
    .select(
      `id, vendor_id, title, slug, excerpt, price, image_url, stock, status, created_at, category, product_type, variants,
       vendor_profiles (store_name, store_logo_url, is_approved, is_live)`,
    )
    .eq("status", "published");
  if (error) throw error;
  const live = (data || []).filter(
    (p: any) => !p.vendor_profiles || (p.vendor_profiles.is_approved !== false && p.vendor_profiles.is_live !== false),
  );
  const pool = live.length > 0 ? live : [...globalMockProductsList];
  return pool.sort(() => Math.random() - 0.5).slice(0, limit);
}

/** Single product by slug, same selection + approved-vendor rule as productBySlugQueryOptionsV2. */
export async function getProductBySlug(slug: string) {
  const { data, error } = await requireClient()
    .from("products")
    .select(`*, vendor_profiles (id, store_name, store_logo_url, store_slug, is_approved, is_live)`)
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1);
  if (error) throw error;
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
  const { data, error } = await requireClient()
    .from("vendor_profiles")
    .select("id, store_name, store_description, store_logo_url, store_slug, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as any[];
}

const VENDOR_COLUMNS =
  "id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, vendor_type, created_at, updated_at, store_categories, store_slug";

/** Vendor by store_slug, falling back to UUID (legacy URLs). Returns null when not found. */
export async function getVendorBySlug(slug: string) {
  const client = requireClient();
  if (!UUID_RE.test(slug)) {
    const { data, error } = await client.from("vendor_profiles").select(VENDOR_COLUMNS).eq("store_slug", slug).maybeSingle();
    if (error) throw error;
    if (data) return data as any;
  } else {
    const { data, error } = await client.from("vendor_profiles").select(VENDOR_COLUMNS).eq("id", slug).maybeSingle();
    if (error) throw error;
    if (data) return data as any;
  }
  return null;
}

export async function getVendorProducts(vendorId: string) {
  const { data, error } = await requireClient()
    .from("products")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("status", "published");
  if (error) throw error;
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
