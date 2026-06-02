import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.lifestylemedicinegateway.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/categories/menopause-support`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/healthy-ageing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/gut-health`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/sleep-recovery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/stress-management`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/weight-management`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/heart-health`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/brain-health`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/categories/womens-wellness`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/guides/best-menopause-products-australia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/guides/best-gut-health-supplements`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/guides/best-sleep-support-products`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/recipes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/vendors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/natural-remedies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/studies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sell-with-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // If Supabase is not configured, return static pages only
  if (!supabaseUrl || !supabaseKey) {
    return staticPages;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch dynamic content slugs
  const [productsRes, articlesRes, recipesRes, vendorsRes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('status', 'published'),
    supabase.from('articles').select('slug, updated_at'),
    supabase.from('recipes').select('slug, updated_at'),
    supabase.from('vendor_profiles').select('store_name, updated_at').eq('is_approved', true),
  ]);

  const productPages: MetadataRoute.Sitemap = (productsRes.data || []).map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
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
    url: `${SITE_URL}/vendors/${encodeURIComponent(v.store_name.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...articlePages, ...recipePages, ...vendorPages];
}
