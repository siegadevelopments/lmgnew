'use client'

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

import { getUserActivity } from "@/lib/tracking";

type SortOption = "recommended" | "random" | "newest" | "price-low" | "price-high" | "name";

const wellnessGoals = [
  "All",
  "Menopause",
  "Gut Health",
  "Sleep",
  "Stress",
  "Weight",
  "Heart",
  "Brain",
  "Women",
  "Ageing",
];

export default function ProductsPage() {
  const { data, isLoading, error } = useQuery(productsQueryOptions());
  const products = data as any[] | undefined;
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  // Get unique categories from actual products
  const productCategories = useMemo(() => {
    if (!products) return [];
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.product_type !== "service") cats.add(p.category);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter((p) => {
      const isProduct = p.product_type !== "service";
      const matchesSearch = p.title.toLowerCase().includes(searchInput.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      return isProduct && matchesSearch && matchesCategory;
    });

    // Sorting
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "random":
        filtered = [...filtered].sort(() => Math.random() - 0.5);
        break;
      case "recommended":
      default: {
        const { preferredCategories, viewedProductIds } = getUserActivity();
        const scored = filtered.map((p) => {
          let score = Math.random(); // Base random distribution
          if (preferredCategories.length > 0 && p.category) {
            const catIndex = preferredCategories.indexOf(p.category);
            if (catIndex === 0) score += 3.0;
            else if (catIndex === 1) score += 2.0;
            else if (catIndex > 1) score += 1.0;
          }
          if (viewedProductIds.includes(p.id)) {
            score += 0.5;
          }
          return { product: p, score };
        });
        filtered = scored.sort((a, b) => b.score - a.score).map((s) => s.product);
        break;
      }
    }

    return filtered;
  }, [products, searchInput, activeCategory, sortBy]);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Search */}
      <div className="bg-wellness-muted py-10 sm:py-14 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Products" }]} />

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Wellness Marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Trusted products for your lifestyle medicine journey. Shop supplements, skincare, equipment, and more from verified Australian brands.
          </p>

          <div className="mt-6 max-w-2xl">
            <div className="relative flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search supplements, skincare, gut health..."
                  className="pl-10 border-0 focus-visible:ring-0 shadow-none h-12"
                />
              </div>
              <Button className="h-12 px-8 rounded-lg font-bold">Search</Button>
            </div>
          </div>

          {/* Category + Sort */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {productCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  activeCategory === cat
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results + Sort Bar */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            {searchInput ? ` matching "${searchInput}"` : ""}
          </p>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-transparent border border-border rounded-lg px-3 py-1.5 text-foreground focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="recommended">Recommended for You</option>
              <option value="random">Randomize</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden bg-card border border-border/50">
                <Skeleton className="aspect-square w-full" />
                <div className="p-2.5 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
            <p className="text-destructive font-medium">Failed to load products. Please try refreshing.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-wellness-muted">
                  <svg
                    className="h-10 w-10 text-primary/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <h2 className="mt-6 text-xl font-semibold text-foreground">No products found</h2>
                <p className="mt-2 text-muted-foreground">
                  {searchInput
                    ? "Try adjusting your search or browse by category"
                    : "Products from vendors will appear here once they're published."}
                </p>
                <Link href="/categories" className="mt-4 inline-block text-primary hover:underline font-medium">
                  Browse by wellness goal →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
