import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
            Scientific Studies
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            In-depth research and analytical studies within the field of lifestyle medicine.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search studies..."
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
             <p className="text-muted-foreground text-lg">No studies matched your search.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
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
    </div>
  );
}
