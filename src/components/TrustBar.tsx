'use client'

import { useQuery } from "@tanstack/react-query";
import { trustStatsQueryOptions } from "@/lib/queries";
import { motion } from "framer-motion";

interface TrustStat {
  value: string;
  label: string;
  icon: string;
}

export function TrustBar() {
  const { data: stats } = useQuery(trustStatsQueryOptions());

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
