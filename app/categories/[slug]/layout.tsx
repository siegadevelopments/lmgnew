import type { Metadata } from "next";
import { categoryConfig } from "./page";
import { buildMetadata, notFoundMetadata } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists. Category content is a static
// config object (not database-backed), so metadata is built from it directly — no fetch needed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryConfig[slug];

  if (!category) return notFoundMetadata("Category Not Found");

  return buildMetadata({
    title: `${category.name} Products`,
    description: category.heroDescription?.slice(0, 160) || category.description,
    path: `/categories/${slug}`,
  });
}

export default function CategorySlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
