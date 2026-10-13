import type { Metadata } from "next";
import { categoryConfig } from "@/lib/category-config";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists. Category content is a static
// config object (not database-backed), so metadata is built from it directly — no fetch needed.
// The config MUST come from a plain module (src/lib/category-config.ts): importing it from the
// 'use client' page.tsx gives the server an opaque client reference, so every lookup returned
// undefined and every category rendered as "Category Not Found" / noindex.
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
    description: toPlainDescription(category.heroDescription) || category.description,
    path: `/categories/${slug}`,
  });
}

export default function CategorySlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
