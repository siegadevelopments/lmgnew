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

        <div className="mt-10 overflow-hidden">
          <div className="animate-marquee flex gap-12 py-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 shrink-0">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
              : [...(vendors || []), ...(vendors || [])].map((vendor, idx) => (
                  <Link
                    key={`${vendor.id}-${idx}`}
                    to="/vendors/$slug"
                    params={{ slug: vendor.id }}
                    className="group flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-2 shrink-0"
                  >
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                      {vendor.store_logo_url ? (
                        <img src={vendor.store_logo_url} className="h-20 w-20 rounded-full object-cover shadow-sm transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-wellness-muted text-2xl font-bold text-primary shadow-sm">
                          {vendor.store_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="text-center text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {vendor.store_name}
                    </h3>
                  </Link>
                ))}
          </div>
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/vendors" className="text-sm font-medium text-primary hover:underline">View all vendors →</Link>
        </div>
      </div>
    </section>
  );
}
