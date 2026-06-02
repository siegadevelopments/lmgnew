'use client'

import Link from "next/link";
import { motion } from "framer-motion";

const wellnessCategories = [
  {
    name: "Menopause Support",
    slug: "menopause-support",
    icon: "🌸",
    description: "Natural solutions for menopause symptoms",
    color: "from-pink-50 to-rose-50",
    borderColor: "hover:border-pink-300",
  },
  {
    name: "Healthy Ageing",
    slug: "healthy-ageing",
    icon: "✨",
    description: "Products for graceful, vibrant ageing",
    color: "from-amber-50 to-yellow-50",
    borderColor: "hover:border-amber-300",
  },
  {
    name: "Gut Health",
    slug: "gut-health",
    icon: "🦠",
    description: "Probiotics, prebiotics & digestive support",
    color: "from-green-50 to-emerald-50",
    borderColor: "hover:border-green-300",
  },
  {
    name: "Sleep & Recovery",
    slug: "sleep-recovery",
    icon: "🌙",
    description: "Better sleep for better health",
    color: "from-indigo-50 to-blue-50",
    borderColor: "hover:border-indigo-300",
  },
  {
    name: "Stress Management",
    slug: "stress-management",
    icon: "🧘",
    description: "Adaptogens & calming solutions",
    color: "from-violet-50 to-purple-50",
    borderColor: "hover:border-violet-300",
  },
  {
    name: "Weight Management",
    slug: "weight-management",
    icon: "⚖️",
    description: "Metabolism & healthy weight support",
    color: "from-orange-50 to-amber-50",
    borderColor: "hover:border-orange-300",
  },
  {
    name: "Heart Health",
    slug: "heart-health",
    icon: "❤️",
    description: "Cardiovascular wellness essentials",
    color: "from-red-50 to-rose-50",
    borderColor: "hover:border-red-300",
  },
  {
    name: "Brain Health",
    slug: "brain-health",
    icon: "🧠",
    description: "Cognitive support & mental clarity",
    color: "from-cyan-50 to-teal-50",
    borderColor: "hover:border-cyan-300",
  },
  {
    name: "Women's Wellness",
    slug: "womens-wellness",
    icon: "💜",
    description: "Holistic health for women",
    color: "from-fuchsia-50 to-pink-50",
    borderColor: "hover:border-fuchsia-300",
  },
];

export function WellnessCategoryGrid() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shop by Wellness Goal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find the right products for your health journey
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 lg:gap-4">
          {wellnessCategories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className={`group flex flex-col items-center gap-2 rounded-2xl border border-border bg-gradient-to-br ${cat.color} p-5 sm:p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${cat.borderColor}`}
              >
                <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                  {cat.icon}
                </span>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 hidden sm:block">
                    {cat.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
