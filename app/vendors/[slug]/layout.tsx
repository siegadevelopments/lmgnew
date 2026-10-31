import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVendorBySlug, getVendorProducts } from '@/lib/server-data';
import { ServerHydrate } from '@/components/ServerHydrate';

const SITE_URL = 'https://www.lifestylemedicinegateway.com';

// ISR: rendered on first request, cached, refreshed every hour; a failed refresh keeps the
// last good page. generateStaticParams returning [] opts the route into ISR without prebuilding.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the layout so each request queries once. A lookup failure throws
// (after retries) so the response is a 5xx and never a cached "Vendor Not Found"/noindex page; only
// a successful lookup that finds no vendor returns a real 404.
const loadVendor = cache(async (slug: string) => {
  const vendor = await getVendorBySlug(slug);
  const products = vendor ? await getVendorProducts(vendor.id) : [];
  return { vendor, products };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { vendor } = await loadVendor(slug);
  if (!vendor) {
    return {
      title: { absolute: 'Vendor Not Found — Lifestyle Medicine Gateway' },
      description: 'The vendor you are looking for could not be found.',
      robots: { index: false, follow: false },
    };
  }

  // `absolute` so the root layout's "%s | Lifestyle Medicine Gateway" template isn't applied twice.
  const title = `${vendor.store_name} — Wellness Vendor | Lifestyle Medicine Gateway`;
  const description =
    vendor.store_description?.slice(0, 160) ||
    `Shop products and services from ${vendor.store_name} on Lifestyle Medicine Gateway.`;
  const canonicalSlug = vendor.store_slug || slug;

  return {
    title: { absolute: title },
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
    robots: { index: true, follow: true },
  };
}

// The vendor and their products are seeded into the React Query cache so the (client) vendor page
// renders real content during SSR; a slug matching no vendor returns a real 404.
export default async function VendorSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { vendor, products } = await loadVendor(slug);
  if (!vendor) notFound();

  const entries: React.ComponentProps<typeof ServerHydrate>['entries'] = [
    [['vendor', slug], vendor],
    [['products', 'vendor', vendor.id], products],
  ];

  return <ServerHydrate entries={entries}>{children}</ServerHydrate>;
}
