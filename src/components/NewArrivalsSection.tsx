import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";

export function NewArrivalsSection() {
  const { data: products, isLoading } = useQuery(productsQueryOptions());

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="bg-wellness-50 py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              New arrivals
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The latest additions to our marketplace
            </p>
          </div>
          <Link to="/products" className="hidden text-sm font-medium text-primary hover:underline sm:block">
            See more products →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/4" />
                  </div>
                </div>
              ))
            : products?.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">
            See more products →
          </Link>
        </div>
      </div>
    </section>
  );
}
