'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { decodeEntities, stripHtml } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArticlesPage() {
  const { data: articles, isLoading, error } = useQuery(articlesQueryOptions());
  const [search, setSearch] = useState("");

  const filteredArticles = (articles || []).filter((article) => {
    // Exclude natural remedies from the main articles view
    const cat = article.category_name?.toLowerCase() || "";
    if (cat === "natural remedies" || cat === "remedies") return false;

    // Apply search filter
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (article.title?.toLowerCase() || "").includes(searchLower) ||
      (decodeEntities(article.title || "").toLowerCase()).includes(searchLower) ||
      (article.excerpt?.toLowerCase() || "").includes(searchLower)
    );
  });

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
        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl bg-card border border-border">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
            <p className="text-destructive font-medium">Failed to load articles. Please try refreshing.</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
            <p className="text-muted-foreground text-lg">No articles matched your search.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl bg-card border border-border transition-all hover:shadow-card hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                  {article.image_url ? (
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                    const raw = article.excerpt || article.content || "";
                    const plain = stripHtml(raw);
                    const truncated = plain.length > 160 ? plain.slice(0, 160) + "..." : plain;
                    
                    return truncated ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {truncated}
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
