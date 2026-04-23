import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/natural-remedies")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(articlesQueryOptions("Natural remedies"));
  },
  head: () => ({
    meta: [
      { title: "Natural Remedies — Lifestyle Medicine Gateway" },
      { name: "description", content: "Explore natural solutions and holistic remedies for a better lifestyle." },
    ],
  }),
  component: RemediesPage,
});

function RemediesPage() {
  const { data: articles } = useSuspenseQuery(articlesQueryOptions("Natural remedies"));

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center md:text-left border-l-4 border-primary pl-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-emerald-700 dark:text-emerald-400">Natural Remedies</h1>
          <p className="mt-4 text-lg text-muted-foreground">Holistic solutions and alternative therapies for everyday wellness.</p>
        </div>

        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No remedies currently listed in this section.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="aspect-video overflow-hidden">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-medium text-lg text-balance p-4 text-center">
                      Natural Remedy
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground line-clamp-3 text-sm">
                    {article.excerpt ? article.excerpt.replace(/<\/?[^>]+(>|$)/g, "") : "Click to read more about this natural remedy."}
                  </p>
                  <p className="mt-auto pt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">Explore Remedy &rarr;</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
