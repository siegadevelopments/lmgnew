'use client'

import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { useState, useMemo, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { decodeEntities } from "@/lib/utils";
import Link from "next/link";

function RemediesContent() {
  const { data: articles } = useSuspenseQuery(articlesQueryOptions());
  const [search, setSearch] = useState("");

  // Filter articles that serve as natural remedies / therapeutic guides
  const remedies = useMemo(() => {
    const remedyKeywords = ["remedy", "remedies", "herb", "oil", "tea", "extract", "natural", "treatment", "supplement", "cure", "relief", "heal", "boost", "support"];
    return (articles || []).filter((article) => {
      const titleLower = (article.title || "").toLowerCase();
      const excerptLower = (article.excerpt || "").toLowerCase();
      const isRemedyLike = remedyKeywords.some(kw => titleLower.includes(kw) || excerptLower.includes(kw));
      
      if (!isRemedyLike) return false;

      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        titleLower.includes(query) ||
        decodeEntities(article.title || "").toLowerCase().includes(query) ||
        excerptLower.includes(query)
      );
    });
  }, [articles, search]);

  return (
    <div className="bg-background min-h-screen">
      {/* Header Banner */}
      <div className="bg-emerald-900/5 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Remedies Directory
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Remedies
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Targeted health solutions, herbal supports, and natural therapies organized clearly by remedy title and indication.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search remedies by title or condition..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background shadow-xs border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {remedies.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
            <p className="text-muted-foreground text-lg">No remedies found matching "{search}".</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remedies.map((remedy) => {
              const title = decodeEntities(remedy.title || "");
              const cleanExcerpt = remedy.excerpt
                ? remedy.excerpt.replace(/<\/?[^>]+(>|$)/g, "")
                : "Explore health benefits and natural indications.";

              return (
                <Link
                  key={remedy.id}
                  href={`/articles/${remedy.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-card p-6 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                      Natural Solution
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {title}
                    </h2>
                    <p className="mt-3 text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {cleanExcerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <span>View Remedy Guide</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RemediesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RemediesContent />
    </Suspense>
  );
}
