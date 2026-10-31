import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { buildMetadata } from "@/lib/seo-metadata";
import { getTradeProducts } from "@/lib/server-data";

// Trade listings (wholesale, salon-only and bulk packs) for salons, clinics and businesses.
// They're kept out of retail browsing (src/lib/trade.ts) and listed here, grouped by brand.
export const revalidate = 3600; // matches DATA_REVALIDATE_SECONDS in src/lib/server-data.ts

export const metadata: Metadata = buildMetadata({
  title: "Trade & Salon Products",
  description:
    "Wholesale, salon-size and bulk wellness products from Australian brands, for salons, clinics and businesses.",
  path: "/trade",
});

export default async function TradePage() {
  const byStore = await getTradeProducts();
  const stores = Object.keys(byStore).sort((a, b) => a.localeCompare(b));

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-surface border-b border-border py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Trade & Salon" }]} />
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Trade &amp; salon products</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Wholesale, salon-size and bulk products from our brands, for salons, clinics, practitioners and other
            businesses. Shopping for yourself?{" "}
            <Link href="/products" className="font-medium text-primary hover:underline">
              Browse the retail shop
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {stores.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No trade products are listed at the moment.</p>
        ) : (
          stores.map((store) => (
            <section key={store} className="mb-12" aria-labelledby={`trade-${store}`}>
              <h2 id={`trade-${store}`} className="text-xl font-bold text-foreground">
                {store} <span className="text-sm font-normal text-muted-foreground">({byStore[store].length})</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                {byStore[store].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
