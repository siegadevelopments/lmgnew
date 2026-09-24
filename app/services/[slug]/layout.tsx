import type { Metadata } from "next";
import { productBySlugQueryOptionsV2 } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// Services reuse the product detail page/data (see page.tsx re-export) but live at their own
// /services/{slug} URL, so they need their own canonical rather than inheriting products'.
// See app/products/[slug]/layout.tsx for the general rationale.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await productBySlugQueryOptionsV2(slug).queryFn!(undefined as any);
  const service = Array.isArray(results) ? results[0] : undefined;

  if (!service) return notFoundMetadata("Service Not Found");

  return buildMetadata({
    title: service.title,
    description:
      toPlainDescription(service.excerpt) ||
      `Book ${service.title}${service.brand ? ` with ${service.brand}` : ""} on Lifestyle Medicine Gateway.`,
    path: `/services/${slug}`,
    image: service.image_url,
  });
}

export default function ServiceSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
