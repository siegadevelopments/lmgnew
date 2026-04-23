import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Lifestyle Medicine Gateway" },
      { name: "description", content: "Search products, articles, and recipes" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ products: any[], articles: any[], recipes: any[] }>({ products: [], articles: [], recipes: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults({ products: [], articles: [], recipes: [] });
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);

      const [productsRes, articlesRes, recipesRes] = await Promise.all([
        supabase.from("products").select("*").ilike("title", `%${query}%`).eq("status", "published").limit(6),
        supabase.from("articles").select("*").ilike("title", `%${query}%`).limit(6),
        supabase.from("recipes").select("*").ilike("title", `%${query}%`).limit(6),
      ]);

      setResults({
        products: productsRes.data || [],
        articles: articlesRes.data || [],
        recipes: recipesRes.data || [],
      });
      setLoading(false);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const totalResults = results.products.length + results.articles.length + results.recipes.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Search Bar */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search products, articles, recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 text-lg rounded-xl border-2 focus-visible:ring-2"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <p className="mt-4 text-sm text-muted-foreground">
          {totalResults === 0 ? `No results for "${query}"` : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
        </p>
      )}

      {/* Products */}
      {results.products.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Products</h2>
            <Badge variant="secondary">{results.products.length}</Badge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.products.map((product) => (
              <Link
                key={product.id}
                to="/products/$slug"
                params={{ slug: product.slug }}
                className="group rounded-xl border border-border bg-card p-3 transition-all hover:shadow-card"
              >
                {product.image_url && <img src={product.image_url} className="h-32 w-full rounded-lg object-cover" />}
                <h3 className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">{product.title}</h3>
                <p className="mt-1 text-sm font-bold text-primary">${product.price}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Articles */}
      {results.articles.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Articles</h2>
            <Badge variant="secondary">{results.articles.length}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {results.articles.map((article) => (
              <Link
                key={article.id}
                to="/articles/$slug"
                params={{ slug: article.slug }}
                className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:shadow-card"
              >
                {article.image_url && <img src={article.image_url} className="h-16 w-16 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-1">{article.title}</h3>
                  {article.excerpt && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: article.excerpt }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recipes */}
      {results.recipes.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recipes</h2>
            <Badge variant="secondary">{results.recipes.length}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {results.recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to="/recipes/$slug"
                params={{ slug: recipe.slug }}
                className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:shadow-card"
              >
                {recipe.image_url && <img src={recipe.image_url} className="h-16 w-16 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-1">{recipe.title}</h3>
                  {recipe.excerpt && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: recipe.excerpt }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!searched && !loading && (
        <div className="mt-16 text-center">
          <svg className="mx-auto h-16 w-16 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="mt-4 text-sm text-muted-foreground">
            Start typing to search across products, articles, and recipes
          </p>
        </div>
      )}
    </div>
  );
}
