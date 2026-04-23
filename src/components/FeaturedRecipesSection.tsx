import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { recipesQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedRecipesSection() {
  const { data, isLoading } = useQuery({
    ...recipesQueryOptions(),
    select: (data) => data.slice(0, 4), // Get latest 4
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Nutritious Recipes</h2>
            <p className="mt-2 text-sm text-muted-foreground">Delicious meals approved by wellness experts</p>
          </div>
          <Link to="/recipes" className="hidden text-sm font-medium text-primary hover:underline sm:block">
            View all recipes →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : data?.map((recipe) => (
                <Link
                  key={recipe.id}
                  to="/recipes/$slug"
                  params={{ slug: recipe.slug }}
                  className="group block rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                    {recipe.image_url && (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    {(recipe.prep_time || recipe.cook_time) && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
                        {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {recipe.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {recipe.excerpt ? recipe.excerpt.replace(/<[^>]+>/g, '') : 'Healthy recipe'}
                    </p>
                  </div>
                </Link>
              ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/recipes" className="text-sm font-medium text-primary hover:underline">View all recipes →</Link>
        </div>
      </div>
    </section>
  );
}
