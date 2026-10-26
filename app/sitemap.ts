import { MetadataRoute } from 'next';
import { getNonEmptyCategorySlugs, getServerSupabase } from '@/lib/server-data';
import { categoryConfig } from '@/lib/category-config';
import { guideConfig } from '@/lib/guide-config';

const SITE_URL = 'https://www.lifestylemedicinegateway.com';

// Regenerate hourly instead of once at build time — without this, a transient Supabase
// hiccup during `next build` throws here and fails the entire production build (this has
// happened before), and the sitemap would otherwise never pick up new content without a
// redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/recipes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/vendors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/trade`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/natural-remedies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/studies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/anecdotes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/memes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/charts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sell-with-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/media-package`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Category and guide pages come from the same config modules the pages render from, so the
  // sitemap can never drift from what actually exists.
  // Categories with no products are left out (thin pages); if the count fails, list them all.
  let categorySlugs = Object.keys(categoryConfig);
  try {
    categorySlugs = await getNonEmptyCategorySlugs();
  } catch (err) {
    console.error('sitemap: category counts unavailable, listing every category', err);
  }
  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/categories/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));
  const guidePages: MetadataRoute.Sitemap = Object.keys(guideConfig).map((slug) => ({
    url: `${SITE_URL}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  const fixedPages = [...staticPages, ...categoryPages, ...guidePages];

  // If Supabase is not configured, return the fixed pages only
  const supabase = getServerSupabase();
  if (!supabase) {
    return fixedPages;
  }

  // A broken/missing env var or a transient Supabase error must never take the sitemap (or
  // the build, which prerenders this route) down — degrade to the static page list instead.
  let productsRes: { data: any[] | null } = { data: null };
  let articlesRes: { data: any[] | null } = { data: null };
  let recipesRes: { data: any[] | null } = { data: null };
  let vendorsRes: { data: any[] | null } = { data: null };
  try {
    [productsRes, articlesRes, recipesRes, vendorsRes] = await Promise.all([
      supabase.from('products').select('slug, updated_at, product_type').eq('status', 'published'),
      supabase.from('articles').select('slug, updated_at'),
      supabase.from('recipes').select('slug, updated_at'),
      supabase.from('vendor_profiles').select('id, store_name, store_slug, updated_at').eq('is_approved', true),
    ]);
  } catch (err) {
    console.error('sitemap: failed to fetch dynamic content, falling back to static pages', err);
    return fixedPages;
  }

  // supabase-js reports query failures in `error` rather than throwing; surface them so a bad key
  // (e.g. disabled legacy API keys) doesn't silently produce a sitemap with no products/vendors.
  for (const [name, res] of Object.entries({ productsRes, articlesRes, recipesRes, vendorsRes })) {
    if ((res as any).error) console.error(`sitemap: ${name} query failed`, (res as any).error.message);
  }

  // Services share the products table but live (and are canonicalised) under /services/.
  const productPages: MetadataRoute.Sitemap = (productsRes.data || []).map((p) => ({
    url: `${SITE_URL}/${p.product_type === 'service' ? 'services' : 'products'}/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = (articlesRes.data || []).map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const recipePages: MetadataRoute.Sitemap = (recipesRes.data || []).map((r) => ({
    url: `${SITE_URL}/recipes/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const vendorPages: MetadataRoute.Sitemap = (vendorsRes.data || []).map((v) => ({
    url: `${SITE_URL}/vendors/${v.store_slug || v.id}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...fixedPages, ...productPages, ...articlePages, ...recipePages, ...vendorPages];
}
