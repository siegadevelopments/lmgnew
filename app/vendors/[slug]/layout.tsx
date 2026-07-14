import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.lifestylemedicinegateway.com';

// UUID v4 regex
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getVendor(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try by store_slug first, then fallback to UUID
  if (!UUID_RE.test(slug)) {
    const { data } = await supabase
      .from('vendor_profiles')
      .select('store_name, store_description, store_logo_url, store_slug')
      .eq('store_slug', slug)
      .single();
    if (data) return data;
  }

  // Fallback: query by id (UUID)
  const { data } = await supabase
    .from('vendor_profiles')
    .select('store_name, store_description, store_logo_url, store_slug')
    .eq('id', slug)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  if (!vendor) {
    return {
      title: 'Vendor Not Found — Lifestyle Medicine Gateway',
      description: 'The vendor you are looking for could not be found.',
    };
  }

  const title = `${vendor.store_name} — Wellness Vendor | Lifestyle Medicine Gateway`;
  const description =
    vendor.store_description?.slice(0, 160) ||
    `Shop products and services from ${vendor.store_name} on Lifestyle Medicine Gateway.`;
  const canonicalSlug = vendor.store_slug || slug;

  return {
    title,
    description,
    openGraph: {
      title: `${vendor.store_name} | Lifestyle Medicine Gateway`,
      description,
      url: `${SITE_URL}/vendors/${canonicalSlug}`,
      type: 'profile',
      ...(vendor.store_logo_url
        ? {
            images: [
              {
                url: vendor.store_logo_url,
                width: 400,
                height: 400,
                alt: vendor.store_name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary',
      title: `${vendor.store_name} | Lifestyle Medicine Gateway`,
      description,
      ...(vendor.store_logo_url ? { images: [vendor.store_logo_url] } : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/vendors/${canonicalSlug}`,
    },
  };
}

export default function VendorSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
