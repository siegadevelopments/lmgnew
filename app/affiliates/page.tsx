'use client'

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateStore {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  affiliate_url: string;
  is_active: boolean;
  sort_order: number;
}

export default function AffiliatesPage() {
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["affiliate_stores"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("affiliate_stores" as any) as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AffiliateStore[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Trusted Partners
        </span>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Affiliate Stores
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Exclusive deals and trusted wellness products from our hand-picked affiliate partners.
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : affiliates.length === 0 ? (
        <div className="text-center py-20">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No affiliate stores available yet.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {affiliates.map((affiliate) => (
            <a
              key={affiliate.id}
              href={affiliate.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
              onClick={(e) => {
                // Let the natural anchor link work, or handle with JS if needed
                // But for SEO and usability, standard anchor is better
              }}
            >
              {/* Logo area */}
              <div className="flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted p-10 border-b border-border/50 min-h-[180px]">
                {affiliate.logo_url ? (
                  <img
                    src={affiliate.logo_url}
                    alt={affiliate.name}
                    className="max-h-20 max-w-[200px] object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={affiliate.logo_url ? "hidden" : "flex flex-col items-center gap-2"}>
                  <Store className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-lg font-bold text-foreground">{affiliate.name}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {affiliate.name}
                  </h2>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                {affiliate.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {affiliate.description}
                  </p>
                )}
                <div className="mt-5">
                  <Button
                    variant="wellness"
                    className="w-full gap-2"
                    asChild
                  >
                    <div>
                      <ExternalLink className="h-4 w-4" />
                      Shop Now
                    </div>
                  </Button>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-16 text-center text-xs text-muted-foreground/60 max-w-xl mx-auto">
        Affiliate disclosure: Some links on this page are affiliate links. We may earn a commission
        when you make a purchase through these links, at no extra cost to you.
      </p>
    </div>
  );
}
