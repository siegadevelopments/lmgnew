'use client'

import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { decodeEntities } from "@/lib/utils";
import { Quote, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

// Strip HTML tags and decode entities for plain text display
function stripHtml(html: string): string {
  if (!html) return '';
  // First strip tags, then decode entities
  const stripped = html.replace(/<[^>]*>/g, ' ');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

function AnecdotesContent() {
  const { data: articles } = useSuspenseQuery(articlesQueryOptions());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles that have an excerpt (anecdote) OR are in the 'Anecdotes' category
  const allAnecdotes = useMemo(() => {
    return (articles || []).filter((a) => 
      (a.excerpt && a.excerpt.trim().length > 0) || 
      (a.category_name?.toLowerCase() === 'anecdotes')
    );
  }, [articles]);

  // Apply search filtering
  const filteredAnecdotes = useMemo(() => {
    if (!searchQuery.trim()) return allAnecdotes;
    
    const query = searchQuery.toLowerCase();
    return allAnecdotes.filter(a => 
      a.title?.toLowerCase().includes(query) || 
      a.excerpt?.toLowerCase().includes(query) ||
      a.content?.toLowerCase().includes(query)
    );
  }, [allAnecdotes, searchQuery]);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-wellness-muted py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-wellness-green/20 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl text-balance">
              Wellness <span className="text-primary">Anecdotes</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              A curated collection of wisdom, research snippets, and inspiring moments from our wellness community.
            </p>

            {/* Search Bar */}
            <div className="mt-10 max-w-md mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Search anecdotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background/80 backdrop-blur-sm border-border/50 rounded-full focus:ring-primary shadow-sm"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filteredAnecdotes.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No anecdotes matching "${searchQuery}"` : "No anecdotes found. Start publishing articles with excerpts or categorize them as 'Anecdotes'!"}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 space-y-6">
            {filteredAnecdotes.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="break-inside-avoid"
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="group block relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="absolute top-4 right-6 opacity-5 transition-opacity group-hover:opacity-10">
                    <Quote className="h-12 w-12 text-primary" />
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-lg font-medium leading-relaxed text-foreground italic mb-6">
                      {(() => {
                        const raw = article.excerpt || article.content || '';
                        const plain = stripHtml(raw);
                        return plain.length > 180 ? plain.slice(0, 180) + '…' : plain || 'Read more →';
                      })()}
                    </p>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {article.title?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {decodeEntities(article.title || "")}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          {new Date(article.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnecdotesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AnecdotesContent />
    </Suspense>
  );
}
