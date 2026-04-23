import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { recipesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/recipes/")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(recipesQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Recipes — Lifestyle Medicine Gateway" },
      { name: "description", content: "Healthy, lifestyle-medicine aligned recipes." },
    ],
  }),
  component: RecipesPage,
});

function RecipesPage() {
  const { data: recipes } = useSuspenseQuery(recipesQueryOptions());

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Healthy Recipes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Nutritious meals to support your lifestyle medicine journey.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to="/recipes/$slug"
              params={{ slug: recipe.slug }}
              className="group flex flex-col overflow-hidden rounded-xl bg-card border border-border transition-all hover:shadow-card hover:-translate-y-1"
            >
              <div className="aspect-video overflow-hidden bg-muted relative">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/30">No Image</div>
                )}
                {(recipe.prep_time || recipe.cook_time) && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                    {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {recipe.title}
                </h3>
                {recipe.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: recipe.excerpt }} />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
