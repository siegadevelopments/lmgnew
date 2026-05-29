'use client'

import { useQuery } from "@tanstack/react-query";
import { recipesQueryOptions } from "@/lib/queries";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { decodeEntities } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/security";
import Link from "next/link";
import Image from "next/image";

export default function RecipesPage() {
  const { data: recipes, isLoading, isError } = useQuery(recipesQueryOptions());
  const [search, setSearch] = useState("");

  const filteredRecipes = useMemo(() => {
    const list = recipes || [];
    if (!search.trim()) return list;
    
    const query = search.toLowerCase();
    return list.filter(
      (recipe) =>
        (recipe.title?.toLowerCase() || "").includes(query) ||
        (decodeEntities(recipe.title || "").toLowerCase()).includes(query) ||
        (recipe.excerpt?.toLowerCase() || "").includes(query),
    );
  }, [recipes, search]);

  const quickRecipes = useMemo(() => {
    return filteredRecipes.filter((recipe) => (recipe.prep_time || 0) + (recipe.cook_time || 0) > 0 && (recipe.prep_time || 0) + (recipe.cook_time || 0) <= 15);
  }, [filteredRecipes]);

  const otherRecipes = useMemo(() => {
    return filteredRecipes.filter((recipe) => {
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
      return totalTime === 0 || totalTime > 15;
    });
  }, [filteredRecipes]);

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Healthy Recipes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Nutritious meals to support your lifestyle medicine journey.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading recipes...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20 max-w-md mx-auto p-6 space-y-4">
            <p className="text-destructive font-bold">Failed to load recipes</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              We encountered a temporary database or connection issue. Please check back in a few moments.
            </p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
            <p className="text-muted-foreground text-lg">No recipes matched your search.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {quickRecipes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-8">
                  15-Minute Recipes
                </h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {quickRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            )}

            {otherRecipes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-8">
                  {quickRecipes.length > 0 ? "More Recipes" : "All Recipes"}
                </h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {otherRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: any }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card border border-border transition-all hover:shadow-card hover:-translate-y-1"
    >
      <div className="aspect-video overflow-hidden bg-muted relative">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            No Image
          </div>
        )}
        {(recipe.prep_time || recipe.cook_time) ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
          </div>
        ) : null}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {decodeEntities(recipe.title || "")}
        </h3>
        {recipe.excerpt && (
          <p
            className="mt-2 text-sm text-muted-foreground line-clamp-3"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(recipe.excerpt) }}
          />
        )}
      </div>
    </Link>
  );
}
