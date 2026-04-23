import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/studies")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(articlesQueryOptions("Studies"));
  },
  head: () => ({
    meta: [
      { title: "Studies — Lifestyle Medicine Gateway" },
      { name: "description", content: "Scientific research and health studies." },
    ],
  }),
  component: StudiesPage,
});

function StudiesPage() {
  const { data: articles } = useSuspenseQuery(articlesQueryOptions("Studies"));

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Scientific Studies</h1>
          <p className="mt-4 text-lg text-muted-foreground">In-depth research and analytical studies within the field of lifestyle medicine.</p>
        </div>

        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No studies found in this category.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="aspect-video overflow-hidden">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground font-semibold text-lg text-balance p-4 text-center">
                      Lifestyle Medicine Study
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground line-clamp-3 text-sm">
                    {article.excerpt ? article.excerpt.replace(/<\/?[^>]+(>|$)/g, "") : "Click to read the full study and findings."}
                  </p>
                  <p className="mt-auto pt-4 text-sm font-medium text-primary">Read Study &rarr;</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
