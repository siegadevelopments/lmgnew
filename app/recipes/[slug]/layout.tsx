import { cache } from "react";
import type { Metadata } from "next";
import { ShopForThisGoal } from "@/components/ShopForThisGoal";
import { getContentForGoal } from "@/lib/server-data";
import { recipeBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists.
// Shared by generateMetadata and the layout, so each request fetches once.
const loadRecipe = cache(async (slug: string) => {
  const results = await recipeBySlugQueryOptions(slug).queryFn!(undefined as any);
  return Array.isArray(results) ? (results[0] as any) : undefined;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await loadRecipe(slug);

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
  // Server-side client (not the browser one loadRecipe uses), so the block works wherever the
  // SEO pages do. A failure just leaves the block out; the page itself handles its own loading.
  let recipe: any = null;
  try {
    recipe = await getContentForGoal("recipes", slug);
  } catch {
    recipe = null;
  }
  return (
    <>
      {children}
      {recipe && <ShopForThisGoal title={recipe.title} body={`${recipe.excerpt ?? ""} ${recipe.content ?? ""}`} />}
    </>
  );
}
