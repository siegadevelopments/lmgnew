import { cache } from "react";
import type { Metadata } from "next";
import { ShopForThisGoal } from "@/components/ShopForThisGoal";
import { getContentForGoal } from "@/lib/server-data";
import { recipeBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists.
// ISR: each recipe is rendered on first request and cached, refreshing every hour, so crawlers and
// readers no longer trigger a server render and Supabase queries on every hit (Vercel Active CPU).
// generateStaticParams returning [] opts the route into ISR without prebuilding.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the layout, so each request fetches once. The exact-slug lookup
// throws after retries, so a Supabase failure is a 5xx and never a cached "Recipe Not Found"/noindex
// page. Only when no exact match exists does the older fuzzy matcher run (legacy slug variants).
const loadContent = cache(async (slug: string) => {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // malformed escape: use the slug as given
  }
  const exact = await getContentForGoal("recipes", decoded);
  if (exact) return exact as any;
  const results = await recipeBySlugQueryOptions(slug).queryFn!(undefined as any);
  return Array.isArray(results) ? (results[0] as any) : undefined;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await loadContent(slug);

  if (!recipe) return notFoundMetadata("Recipe Not Found");

  return buildMetadata({
    title: recipe.title,
    description:
      toPlainDescription((recipe as any).excerpt) ||
      toPlainDescription(recipe.content) ||
      `${recipe.title} — a healthy recipe from Lifestyle Medicine Gateway.`,
    path: `/recipes/${slug}`,
    image: recipe.image_url,
    type: "article",
  });
}

export default async function RecipeSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Same cached lookup as generateMetadata, so this adds no extra query.
  const recipe: any = await loadContent(slug);
  return (
    <>
      {children}
      {recipe && <ShopForThisGoal title={recipe.title} body={`${recipe.excerpt ?? ""} ${recipe.content ?? ""}`} />}
    </>
  );
}
