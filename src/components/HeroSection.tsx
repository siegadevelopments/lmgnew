import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import { motion, Variants } from "framer-motion";

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/products", search: { q: searchQuery, category: "", page: 1 } });
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate({ to: "/products", search: { q: "", category, page: 1 } });
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
      <motion.img
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        src={heroBg}
        alt="Wellness pathway through lush greenery"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
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
            Your Wellness Marketplace
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-black leading-tight tracking-tighter text-primary-foreground sm:text-6xl lg:text-8xl text-balance"
          >
            Elevate Your <span className="text-wellness-light drop-shadow-sm">Wellness</span> Journey
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-8 max-w-xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl font-medium"
          >
            The gateway to trusted products, professional services, and expert knowledge in Lifestyle Medicine.
          </motion.p>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSearch}
            className="mt-8 flex max-w-lg overflow-hidden rounded-xl bg-background shadow-elevated border border-border"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="flex-1 bg-transparent px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button type="submit" variant="wellness" className="m-1.5 rounded-lg px-6">
              Search
            </Button>
          </motion.form>

          <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-2">
            {["Nutrition", "Yoga", "Mental Health", "Supplements", "Coaching"].map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(tag)}
                className="rounded-full border border-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 cursor-pointer"
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
