import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { featuredProductsQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";

export function JustForYouSection() {
  const { data: products, isLoading } = useQuery(featuredProductsQueryOptions());

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="bg-background py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Just for you
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hand-picked recommendations for your wellness journey
            </p>
          </div>
          <Link to="/products" className="hidden text-sm font-medium text-primary hover:underline sm:block">
            View all products →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/4" />
                  </div>
                </div>
              ))
            : products?.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">
            View all products →
          </Link>
        </div>
      </div>
    </section>
  );
}
