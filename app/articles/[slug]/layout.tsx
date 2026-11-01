import { cache } from "react";
import type { Metadata } from "next";
import { ShopForThisGoal } from "@/components/ShopForThisGoal";
import { getContentForGoal } from "@/lib/server-data";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists: gives each article a real,
// self-referencing canonical URL and unique title/description instead of inheriting the
// generic site-wide metadata, without touching the client-rendered page.tsx.

// ISR: each article is rendered on first request and cached, refreshing every hour, so crawlers and
// readers no longer trigger a server render and Supabase queries on every hit (Vercel Active CPU).
// generateStaticParams returning [] opts the route into ISR without prebuilding.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the layout, so each request fetches once. The exact-slug lookup
// throws after retries, so a Supabase failure is a 5xx and never a cached "Article Not Found"/noindex
// page. Only when no exact match exists does the older fuzzy matcher run (legacy slug variants).
const loadContent = cache(async (slug: string) => {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // malformed escape: use the slug as given
  }
  const exact = await getContentForGoal("articles", decoded);
  if (exact) return exact as any;
  const results = await articleBySlugQueryOptions(slug).queryFn!(undefined as any);
  return Array.isArray(results) ? (results[0] as any) : undefined;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadContent(slug);

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
  // Same cached lookup as generateMetadata, so this adds no extra query.
  const article: any = await loadContent(slug);
  return (
    <>
      {children}
      {article && <ShopForThisGoal title={article.title} body={`${article.excerpt ?? ""} ${article.content ?? ""}`} />}
    </>
  );
}
