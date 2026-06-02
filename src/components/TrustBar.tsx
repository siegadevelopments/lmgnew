'use client'

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface TrustStat {
  value: string;
  label: string;
  icon: string;
}

export function TrustBar() {
  const { data: stats } = useQuery({
    queryKey: ["trust-stats", "v1"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [vendorsRes, productsRes, reviewsRes] = await Promise.all([
        supabase
          .from("vendor_profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", true)
          .eq("is_live", true),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase.from("reviews").select("rating"),
      ]);

      const vendorCount = vendorsRes.count || 0;
      const productCount = productsRes.count || 0;
      const reviews = reviewsRes.data || [];
      const avgRating =
        reviews.length > 0
          ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : "5.0";

      return {
        vendors: vendorCount,
        products: productCount,
        rating: avgRating,
        reviewCount: reviews.length,
      };
    },
  });

  const trustStats: TrustStat[] = [
    {
      value: stats ? `${stats.vendors}+` : "—",
      label: "Trusted Brands",
      icon: "🏪",
    },
    {
      value: stats ? `${stats.products}+` : "—",
      label: "Products",
      icon: "📦",
    },
    {
      value: stats ? `★ ${stats.rating}` : "—",
      label: stats ? `${stats.reviewCount} Reviews` : "Reviews",
      icon: "⭐",
    },
    {
      value: "100%",
      label: "Australian",
      icon: "🇦🇺",
    },
    {
      value: "Secure",
      label: "Checkout",
      icon: "🔒",
    },
  ];

  return (
    <section className="border-y border-border bg-card py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 sm:gap-6">
          {trustStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <span className="mt-1.5 text-lg font-black tracking-tight text-foreground sm:text-xl">
                {stat.value}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
