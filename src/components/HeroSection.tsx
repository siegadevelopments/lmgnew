import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

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

  return (
    <section className="relative flex min-h-[540px] items-center overflow-hidden sm:min-h-[600px]">
      {/* Background image */}
      <img
        src={heroBg}
        alt="Wellness pathway through lush greenery"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground">
            Your Wellness Marketplace
          </span>
          <h1 className="text-5xl font-black leading-tight tracking-tighter text-primary-foreground sm:text-6xl lg:text-8xl text-balance">
            Elevate Your <span className="text-wellness-light drop-shadow-sm">Wellness</span> Journey
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl font-medium">
            The gateway to trusted products, professional services, and expert knowledge in Lifestyle Medicine.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-8 flex max-w-lg overflow-hidden rounded-xl bg-background shadow-elevated border border-border">
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
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Nutrition", "Yoga", "Mental Health", "Supplements", "Coaching"].map((tag) => (
              <button
                key={tag}
                onClick={() => handleCategoryClick(tag)}
                className="rounded-full border border-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
