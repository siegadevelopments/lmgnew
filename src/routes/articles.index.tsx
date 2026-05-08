import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { decodeEntities } from "@/lib/utils";

export const Route = createFileRoute("/articles/")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(articlesQueryOptions());
  },
  head: () => {
    const title = "Wellness & Lifestyle Medicine Articles | Expert Insights";
    const description = "Explore the latest research, expert tips, and news on preventative health and lifestyle medicine. Our articles help you stay informed and healthy.";
    const imageUrl = "https://lifestylemedicinegateway.com/logo.png";
    const canonicalUrl = "https://lifestylemedicinegateway.com/articles";

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://lifestylemedicinegateway.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": canonicalUrl
        }
      ]
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: imageUrl },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
        { name: "canonical", content: canonicalUrl },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbLd),
        }
      ]
    };
  },
  component: ArticlesPage,
});

function ArticlesPage() {
  const { data: articles } = useSuspenseQuery(articlesQueryOptions());
  const [search, setSearch] = useState("");

  const filteredArticles = articles.filter(
    (article) =>
      (article.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (decodeEntities(article.title || "").toLowerCase()).includes(search.toLowerCase()) ||
      (article.excerpt?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Wellness Articles
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Expert insights, research, and tips for preventative health.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
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
            <p className="text-muted-foreground text-lg">No articles matched your search.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                className="group flex flex-col overflow-hidden rounded-xl bg-card border border-border transition-all hover:shadow-card hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/50 text-muted-foreground/40">
                      News
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-3">
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {decodeEntities(article.title || "")}
                  </h3>
                  {(() => {
                    const rawExcerpt = article.excerpt || article.content || "";
                    const excerptText = rawExcerpt
                      .replace(/<[^>]*>?/gm, "") // Strip HTML tags
                      .replace(/##\s+/g, "")     // Strip markdown headers
                      .replace(/\*\*/g, "")      // Strip bold
                      .trim();
                    
                    const truncatedExcerpt = excerptText.length > 160 
                      ? excerptText.slice(0, 160) + "..." 
                      : excerptText;
                    
                    return truncatedExcerpt ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {truncatedExcerpt}
                      </p>
                    ) : null;
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
