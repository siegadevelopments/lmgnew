import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { brandsQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedVendorsSection() {
  const { data: vendors, isLoading } = useQuery(brandsQueryOptions());

  if (!isLoading && (!vendors || vendors.length === 0)) return null;

  return (
    <section className="bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured Vendors
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Trusted brands and practitioners
            </p>
          </div>
          <Link to="/vendors" className="hidden text-sm font-medium text-primary hover:underline sm:block">
            View all vendors →
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              ))
            : vendors?.slice(0, 4).map((vendor) => (
                <Link
                  key={vendor.id}
                  to="/vendors/$slug"
                  params={{ slug: vendor.id }} // Using ID since vendors don't have slug yet
                  className="group cursor-pointer rounded-xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  {vendor.store_logo_url ? (
                    <img src={vendor.store_logo_url} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-wellness-muted text-xl font-bold text-primary">
                      {vendor.store_name.charAt(0)}
                    </div>
                  )}
                  <h3 className="mt-4 text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {vendor.store_name}
                  </h3>
                  {vendor.store_description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {vendor.store_description}
                    </p>
                  )}
                </Link>
              ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/vendors" className="text-sm font-medium text-primary hover:underline">View all vendors →</Link>
        </div>
      </div>
    </section>
  );
}
