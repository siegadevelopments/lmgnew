import type { Metadata } from "next";
import { productBySlugQueryOptionsV2 } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// Provides per-product SEO metadata (title, description, canonical, Open Graph, Twitter card)
// without touching page.tsx, which stays a client component for its cart/booking interactivity.
// Before this, every product page inherited the generic site-wide metadata from the root
// layout, and its canonical URL pointed at /products (the listing page) instead of itself —
// telling search engines and AI crawlers to ignore every individual product page.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await productBySlugQueryOptionsV2(slug).queryFn!(undefined as any);
  const product = Array.isArray(results) ? results[0] : undefined;

  if (!product) return notFoundMetadata("Product Not Found");

  return buildMetadata({
    title: product.title,
    description:
      toPlainDescription(product.excerpt) ||
      `${product.title}${product.brand ? ` by ${product.brand}` : ""} — shop wellness products at Lifestyle Medicine Gateway.`,
    path: `/products/${slug}`,
    image: product.image_url,
  });
}

export default function ProductSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
