'use client'

import Link from "next/link";
import { motion } from "framer-motion";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const wellnessCategories = [
  {
    name: "Menopause Support",
    slug: "menopause-support",
    icon: "🌸",
    description: "Natural, evidence-based products to help manage menopause symptoms. From supplements to topical relief, find trusted solutions for hot flashes, mood changes, and hormonal balance.",
    color: "from-pink-50 to-rose-50",
  },
  {
    name: "Healthy Ageing",
    slug: "healthy-ageing",
    icon: "✨",
    description: "Products designed to support graceful, vibrant ageing. Longevity supplements, joint & mobility support, and skin care essentials for looking and feeling your best at any age.",
    color: "from-amber-50 to-yellow-50",
  },
  {
    name: "Gut Health",
    slug: "gut-health",
    icon: "🦠",
    description: "Probiotics, prebiotics, and digestive support products for better gut health. A healthy gut is the foundation of overall wellness.",
    color: "from-green-50 to-emerald-50",
  },
  {
    name: "Sleep & Recovery",
    slug: "sleep-recovery",
    icon: "🌙",
    description: "Natural sleep aids, magnesium supplements, and recovery tools for deeper, more restorative sleep. Wake up refreshed and ready to thrive.",
    color: "from-indigo-50 to-blue-50",
  },
  {
    name: "Stress Management",
    slug: "stress-management",
    icon: "🧘",
    description: "Adaptogens, calming supplements, meditation tools, and aromatherapy products to help manage daily stress and promote mental wellbeing.",
    color: "from-violet-50 to-purple-50",
  },
  {
    name: "Weight Management",
    slug: "weight-management",
    icon: "⚖️",
    description: "Healthy and sustainable weight management products. Meal replacements, metabolism support, and fitness equipment for your wellness journey.",
    color: "from-orange-50 to-amber-50",
  },
  {
    name: "Heart Health",
    slug: "heart-health",
    icon: "❤️",
    description: "Cardiovascular wellness essentials including CoQ10, Omega-3, and heart-supporting supplements for long-term heart health.",
    color: "from-red-50 to-rose-50",
  },
  {
    name: "Brain Health",
    slug: "brain-health",
    icon: "🧠",
    description: "Nootropics, focus supplements, and cognitive support products for mental clarity, memory, and brain longevity.",
    color: "from-cyan-50 to-teal-50",
  },
  {
    name: "Women's Wellness",
    slug: "womens-wellness",
    icon: "💜",
    description: "Holistic health products designed specifically for women. Hormonal balance, iron & energy, and targeted wellness support.",
    color: "from-fuchsia-50 to-pink-50",
  },
];

export default function CategoriesPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Categories" }]} />

        <div className="text-center mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Shop by Wellness Goal
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-muted-foreground">
            Find the right products for your health journey. Browse our curated wellness categories
            designed for women 40+ and anyone committed to evidence-based health.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className={`group flex flex-col h-full rounded-2xl border border-border bg-gradient-to-br ${cat.color} p-6 sm:p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card`}
              >
                <span className="text-4xl" aria-hidden="true">{cat.icon}</span>
                <h2 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Browse Products →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
