import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productBySlugQueryOptionsV2 } from "@/lib/queries";
import { getProductBySlug } from "@/lib/server-data";
import { ServerHydrate } from "@/components/ServerHydrate";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// Provides per-product SEO metadata (title, description, canonical, Open Graph, Twitter card)
// without touching page.tsx, which stays a client component for its cart/booking interactivity.
// Before this, every product page inherited the generic site-wide metadata from the root
// layout, and its canonical URL pointed at /products (the listing page) instead of itself —
// telling search engines and AI crawlers to ignore every individual product page.
//
// The product is also fetched here on the server and seeded into the React Query cache, so the
// page's useSuspenseQuery resolves during SSR: title, price, description, vendor and the Product
// JSON-LD are in the raw HTML. A slug that resolves to no published product returns a real 404.

// Shared by generateMetadata and the layout so each request queries once. Returns undefined (not
// "missing") when the lookup itself fails, so an outage never gets a page marked noindex/404.
const loadProduct = cache(async (slug: string) => {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    console.error("product layout: server lookup failed for", slug, err);
    return undefined;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await loadProduct(slug);
  const product = results?.[0];

  if (results && !product) return notFoundMetadata("Product Not Found");
  if (!product) return buildMetadata({ title: "Product", path: `/products/${slug}` });

  return buildMetadata({
    title: product.title,
    description:
      toPlainDescription(product.excerpt) ||
      `${product.title}${product.brand ? ` by ${product.brand}` : ""} — shop wellness products at Lifestyle Medicine Gateway.`,
    path: `/products/${slug}`,
    image: product.image_url,
  });
}

export default async function ProductSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const results = await loadProduct(slug);
  if (results && results.length === 0) notFound();

  return <ServerHydrate entries={[[productBySlugQueryOptionsV2(slug).queryKey, results]]}>{children}</ServerHydrate>;
}
