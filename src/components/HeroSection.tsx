'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import heroBg from "@/assets/hero-bg.jpg";
import { motion, Variants } from "framer-motion";

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative flex min-h-[540px] items-center overflow-hidden sm:min-h-[600px]">
      <Image
        src={heroBg}
        alt="Wellness pathway through lush greenery - Lifestyle Medicine Gateway Hero"
        fill
        priority
        fetchPriority="high"
        className="object-cover animate-hero-zoom"
        quality={90}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <motion.span
            variants={itemVariants}
            className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground"
          >
            Lifestyle as Medicine
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black leading-tight tracking-tighter text-primary-foreground sm:text-5xl lg:text-7xl text-balance"
          >
            Empowering Your{" "}
            <span className="text-wellness-light drop-shadow-sm">Health Journey</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/90 sm:text-lg font-medium"
          >
            Discover curated wellness products, evidence-based articles, and nourishing recipes
            designed to guide your unique health journey using lifestyle as medicine.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => router.push("/products")}
              variant="wellness"
              className="rounded-xl px-8 h-12 font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
            >
              Shop Products
            </Button>
            <Button
              onClick={() => {
                const el = document.getElementById("wellness-categories");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="outline"
              className="rounded-xl px-8 h-12 font-bold text-base bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
            >
              Browse Categories
            </Button>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSearch}
            className="mt-6 flex items-center max-w-lg rounded-2xl bg-background shadow-elevated border border-border p-1.5"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplements, skincare, gut health..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              aria-label="Search catalog"
            />
            <Button type="submit" variant="wellness" className="rounded-xl px-6 h-11 font-bold">
              Search
            </Button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-4 flex flex-wrap gap-2">
            {["Menopause", "Gut Health", "Sleep", "Weight Management", "Healthy Ageing"].map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(tag)}
                className="rounded-full border border-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 cursor-pointer"
                aria-label={`Browse ${tag} products`}
              >
                {tag}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
