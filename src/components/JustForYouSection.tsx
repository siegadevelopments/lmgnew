import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { featuredProductsQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

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
                <Link
                  key={product.id}
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
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
