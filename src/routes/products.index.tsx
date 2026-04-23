import React, { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
// ... (omitting lines for brevity in instruction, will apply correctly)
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(productsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Products — Lifestyle Medicine Gateway" },
      { name: "description", content: "Shop wellness products from trusted vendors on Lifestyle Medicine Gateway." },
    ],
  }),
  component: ProductsPage,
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Failed to load products</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <button onClick={() => router.invalidate()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
      </div>
    );
  },
});

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Supplements", "Equipment", "Food", "Books", "Digital"];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchInput.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchInput, activeCategory]);

  return (
    <div className="bg-background min-h-screen">
      {/* Shopee-style Hero Search */}
      <div className="bg-wellness-muted py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Wellness Marketplace
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Trusted products for your lifestyle medicine journey.
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
             {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={cn(
                   "px-4 py-2 rounded-full text-xs font-bold transition-all border",
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

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-wellness-muted">
              <svg className="h-10 w-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">No products found</h2>
            <p className="mt-2 text-muted-foreground">
              {searchInput ? "Try adjusting your search" : "Products from vendors will appear here once they're published."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
