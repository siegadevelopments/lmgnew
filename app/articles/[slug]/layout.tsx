import type { Metadata } from "next";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists: gives each article a real,
// self-referencing canonical URL and unique title/description instead of inheriting the
// generic site-wide metadata, without touching the client-rendered page.tsx.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await articleBySlugQueryOptions(slug).queryFn!(undefined as any);
  const article = Array.isArray(results) ? results[0] : undefined;

  if (!article) return notFoundMetadata("Article Not Found");

  return buildMetadata({
    title: article.title,
    description:
      toPlainDescription(article.excerpt) ||
      toPlainDescription(article.content) ||
      `${article.title} — read more on Lifestyle Medicine Gateway.`,
    path: `/articles/${slug}`,
    image: article.image_url,
    type: "article",
  });
}

export default function ArticleSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
