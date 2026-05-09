'use client'

import { useParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { recipeBySlugQueryOptions } from "@/lib/queries";
import { decodeEntities } from "@/lib/utils";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function RecipeContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: recipes } = useSuspenseQuery(recipeBySlugQueryOptions(slug));
  const recipe = recipes?.[0];

  if (!recipe) return <div className="p-20 text-center">Recipe not found</div>;

  return (
    <article className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link href="/recipes" className="text-sm font-medium text-primary hover:underline">
          ← Back to recipes
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
          {decodeEntities(recipe.title || "")}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
          {recipe.prep_time && <span>Prep: {recipe.prep_time}m</span>}
          {recipe.cook_time && <span>Cook: {recipe.cook_time}m</span>}
          {recipe.created_at && (
            <span>Posted: {new Date(recipe.created_at).toLocaleDateString()}</span>
          )}
        </div>

        {recipe.image_url && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-sm">
            <img src={recipe.image_url} alt={recipe.title} className="w-full object-cover" />
          </div>
        )}

        {recipe.content && (
          <div
            className="wp-content prose prose-green mt-10 max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: recipe.content }}
          />
        )}
      </div>
    </article>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RecipeContent />
    </Suspense>
  );
}
