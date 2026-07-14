'use client'

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { brandsQueryOptions } from "@/lib/queries";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorsPage() {
  const { data: vendors, isLoading, error } = useQuery(brandsQueryOptions());

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
        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="mt-5 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-48" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
            <p className="text-destructive font-medium">Failed to load vendors. Please try refreshing.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(vendors || []).map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.store_slug || vendor.id}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-card hover:-translate-y-1"
              >
                {vendor.store_logo_url ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border">
                    <Image
                      src={vendor.store_logo_url}
                      alt={vendor.store_name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-wellness-muted text-3xl font-bold text-primary">
                    {vendor.store_name.charAt(0)}
                  </div>
                )}
                <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-primary transition-colors text-center">
                  {vendor.store_name}
                </h3>
                {vendor.store_description && (
                  <p className="mt-2 text-sm text-muted-foreground text-center line-clamp-2">
                    {vendor.store_description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
