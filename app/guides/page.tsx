'use client'

import Link from "next/link";
import { motion } from "framer-motion";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BookOpen, ChevronRight } from "lucide-react";

const allGuides = [
  {
    title: "Best Menopause Products in Australia (2026)",
    description: "Expert-reviewed products to help manage menopause symptoms naturally. Includes supplements, topical relief, and lifestyle products recommended by health professionals.",
    slug: "best-menopause-products-australia",
    category: "Menopause Support",
    categorySlug: "menopause-support",
    icon: "🌸",
    readTime: "8 min read",
    updated: "June 2026",
  },
  {
    title: "Best Gut Health Supplements (2026)",
    description: "Top-rated probiotics, prebiotics, and digestive enzymes for better gut health. Reviewed by our wellness experts and trusted by thousands of Australians.",
    slug: "best-gut-health-supplements",
    category: "Gut Health",
    categorySlug: "gut-health",
    icon: "🦠",
    readTime: "6 min read",
    updated: "June 2026",
  },
  {
    title: "Best Sleep Support Products (2026)",
    description: "Natural sleep aids, magnesium supplements, and recovery tools reviewed for effectiveness, safety, and value. Expert-tested for better rest.",
    slug: "best-sleep-support-products",
    category: "Sleep & Recovery",
    categorySlug: "sleep-recovery",
    icon: "🌙",
    readTime: "7 min read",
    updated: "June 2026",
  },
  {
    title: "Healthy Ageing Essentials: Products for Longevity",
    description: "The essential supplements and wellness products for healthy ageing. From collagen to CoQ10, discover what science says about ageing gracefully.",
    slug: "healthy-ageing-essentials",
    category: "Healthy Ageing",
    categorySlug: "healthy-ageing",
    icon: "✨",
    readTime: "9 min read",
    updated: "June 2026",
  },
  {
    title: "Best Products for Women Over 50",
    description: "A comprehensive guide to wellness products designed for women over 50. Covering bone health, energy, hormonal balance, and more.",
    slug: "best-products-women-over-50",
    category: "Women's Wellness",
    categorySlug: "womens-wellness",
    icon: "💜",
    readTime: "10 min read",
    updated: "June 2026",
  },
  {
    title: "Best Stress Management Supplements",
    description: "Discover top-rated adaptogens and calming supplements like Ashwagandha and L-Theanine to help regulate your nervous system and reduce stress.",
    slug: "best-stress-management-supplements",
    category: "Stress Management",
    categorySlug: "stress-management",
    icon: "🧘",
    readTime: "6 min read",
    updated: "June 2026",
  },
  {
    title: "Best Weight Management Products",
    description: "Evidence-based products to support healthy metabolism and weight management. Features high-quality protein blends and targeted support.",
    slug: "best-weight-management-products",
    category: "Weight Management",
    categorySlug: "weight-management",
    icon: "⚖️",
    readTime: "7 min read",
    updated: "June 2026",
  },
  {
    title: "Best Heart Health Supplements",
    description: "Support cardiovascular wellness with the best Omega-3s and CoQ10 supplements. Reviewed for purity, potency, and cardiovascular benefits.",
    slug: "best-heart-health-supplements",
    category: "Heart Health",
    categorySlug: "heart-health",
    icon: "❤️",
    readTime: "8 min read",
    updated: "June 2026",
  },
  {
    title: "Best Brain Health & Nootropics",
    description: "Boost cognitive function, focus, and memory with our expertly curated guide to nootropics, including Lion's Mane and focus blends.",
    slug: "best-brain-health-nootropics",
    category: "Brain Health",
    categorySlug: "brain-health",
    icon: "🧠",
    readTime: "9 min read",
    updated: "June 2026",
  },
];

export default function GuidesPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Buying Guides" }]} />

        <div className="mt-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-calm/10">
              <BookOpen className="h-6 w-6 text-calm" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Buying Guides
            </h1>
          </div>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Expert recommendations to help you choose the right wellness products.
            Each guide is researched, reviewed, and updated regularly to ensure you get the best advice.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allGuides.map((guide, index) => (
            <motion.div
              key={guide.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Link
                href={`/guides/${guide.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:border-primary/20 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">{guide.icon}</span>
                  <Link
                    href={`/categories/${guide.categorySlug}`}
                    className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {guide.category}
                  </Link>
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {guide.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{guide.readTime} · Updated {guide.updated}</span>
                  <span className="flex items-center gap-1 font-semibold text-primary group-hover:gap-2 transition-all">
                    Read <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
