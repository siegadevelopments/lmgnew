import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/server-data";
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
  let results: any[] | undefined;
  try {
    results = await getProductBySlug(slug);
  } catch (err) {
    // A failed lookup must not mark the page noindex — only a confirmed miss does.
    console.error("service layout: server lookup failed for", slug, err);
  }
  const service = results?.[0];

  if (results && !service) return notFoundMetadata("Service Not Found");
  if (!service) return buildMetadata({ title: "Service", path: `/services/${slug}` });

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
