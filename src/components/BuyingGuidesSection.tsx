'use client'

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

const buyingGuides = [
  {
    title: "Best Menopause Products in Australia",
    description: "Expert-reviewed products to help manage menopause symptoms naturally and effectively.",
    slug: "best-menopause-products-australia",
    category: "Menopause Support",
    icon: "🌸",
    readTime: "8 min read",
  },
  {
    title: "Best Gut Health Supplements",
    description: "Top-rated probiotics, prebiotics, and digestive enzymes for better gut health.",
    slug: "best-gut-health-supplements",
    category: "Gut Health",
    icon: "🦠",
    readTime: "6 min read",
  },
  {
    title: "Best Sleep Support Products",
    description: "Natural sleep aids and supplements for deeper, more restorative sleep.",
    slug: "best-sleep-support-products",
    category: "Sleep & Recovery",
    icon: "🌙",
    readTime: "7 min read",
  },
];

export function BuyingGuidesSection() {
  return (
    <section className="bg-surface py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-calm/10">
              <BookOpen className="h-5 w-5 text-calm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Buying Guides
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Expert recommendations to help you choose the right products
              </p>
            </div>
          </div>
          <Link
            href="/guides"
            className="hidden text-sm font-medium text-primary hover:underline sm:block"
          >
            All guides →
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buyingGuides.map((guide, index) => (
            <motion.div
              key={guide.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Link
                href={`/guides/${guide.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:border-primary/20 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">{guide.icon}</span>
                  <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                    {guide.category}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {guide.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {guide.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{guide.readTime}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Read Guide <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/guides"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all guides →
          </Link>
        </div>
      </div>
    </section>
  );
}
