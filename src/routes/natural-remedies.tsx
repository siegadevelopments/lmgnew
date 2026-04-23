import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  const [search, setSearch] = useState("");

  const filteredArticles = useMemo(() => {
    return articles.filter(article => 
      (article.title?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (article.excerpt?.toLowerCase() || "").includes(search.toLowerCase())
    );
  }, [articles, search]);

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Natural Remedies
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Holistic solutions and alternative therapies for everyday wellness.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search remedies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
             <p className="text-muted-foreground text-lg">No remedies matched your search.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
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
    </div>
  );
}
