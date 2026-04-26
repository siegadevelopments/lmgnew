import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { brandsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/vendors/")({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(brandsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Vendors — Lifestyle Medicine Gateway" },
      { name: "description", content: "Discover trusted health and wellness vendors." },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const { data: vendors } = useSuspenseQuery(brandsQueryOptions());

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-wellness-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Our Vendors
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover trusted health and wellness vendors.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        <div className="mt-12 grid grid-cols-2 gap-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              to="/vendors/$slug"
              params={{ slug: vendor.id }}
              className="group flex flex-col items-center gap-4 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                {vendor.store_logo_url ? (
                  <img src={vendor.store_logo_url} className="h-28 w-28 rounded-full object-cover shadow-sm transition-transform group-hover:scale-110" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-wellness-muted text-4xl font-bold text-primary shadow-sm">
                    {vendor.store_name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-center text-lg font-bold text-foreground group-hover:text-primary transition-colors px-2">
                {vendor.store_name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
