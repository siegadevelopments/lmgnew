import type { Metadata } from "next";
import { recipeBySlugQueryOptions } from "@/lib/queries";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await recipeBySlugQueryOptions(slug).queryFn!(undefined as any);
  const recipe = Array.isArray(results) ? results[0] : undefined;

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

export default function RecipeSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
