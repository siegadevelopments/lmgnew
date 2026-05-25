'use client'

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const { data, isLoading, error } = useQuery(productsQueryOptions());
  const products = data as any[] | undefined;
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Consultation", "Therapy", "Coaching", "Workshop", "Fitness"];

  const filteredServices = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const isService = p.product_type === "service";
      const matchesSearch = p.title.toLowerCase().includes(searchInput.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return isService && matchesSearch && matchesCategory;
    });
  }, [products, searchInput, activeCategory]);

  return (
    <div className="bg-background min-h-screen">
      {/* Shopee-style Hero Search */}
      <div className="bg-wellness-muted py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Wellness Services
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Book professional services for your lifestyle medicine journey.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for items, brands, or categories..."
                  className="pl-10 border-0 focus-visible:ring-0 shadow-none h-12"
                />
              </div>
              <Button className="h-12 px-8 rounded-lg font-bold">Search</Button>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="mx-auto mt-8 flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  activeCategory === cat
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            <p className="text-destructive font-medium">Failed to load services. Please try refreshing.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {filteredServices.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>

            {filteredServices.length === 0 && (
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
                <h2 className="mt-6 text-xl font-semibold text-foreground">No services found</h2>
                <p className="mt-2 text-muted-foreground">
                  {searchInput
                    ? "Try adjusting your search"
                    : "Services from professionals will appear here once they're published."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
