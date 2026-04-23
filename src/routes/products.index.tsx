import React, { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";

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

  const filteredProducts = products.filter(
    (p) => p.title.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Products
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Wellness products from trusted vendors
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-input bg-card px-5 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
