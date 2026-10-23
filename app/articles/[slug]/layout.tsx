import { cache } from "react";
import type { Metadata } from "next";
import { ShopForThisGoal } from "@/components/ShopForThisGoal";
import { getContentForGoal } from "@/lib/server-data";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists: gives each article a real,
// self-referencing canonical URL and unique title/description instead of inheriting the
// generic site-wide metadata, without touching the client-rendered page.tsx.

// Shared by generateMetadata and the layout, so each request fetches once.
const loadArticle = cache(async (slug: string) => {
  const results = await articleBySlugQueryOptions(slug).queryFn!(undefined as any);
  return Array.isArray(results) ? (results[0] as any) : undefined;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

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

export default async function ArticleSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Server-side client (not the browser one loadArticle uses), so the block works wherever the
  // SEO pages do. A failure just leaves the block out; the page itself handles its own loading.
  let article: any = null;
  try {
    article = await getContentForGoal("articles", slug);
  } catch {
    article = null;
  }
  return (
    <>
      {children}
      {article && <ShopForThisGoal title={article.title} body={`${article.excerpt ?? ""} ${article.content ?? ""}`} />}
    </>
  );
}
