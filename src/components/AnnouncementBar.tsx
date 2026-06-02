'use client'

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "lmg-announcement-dismissed";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary via-wellness to-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium sm:text-sm">
          <span className="mr-1.5">🌿</span>
          Free shipping on orders over $100
          <span className="mx-2 hidden sm:inline">|</span>
          <span className="hidden sm:inline">Trusted Australian wellness brands</span>
          <a
            href="/products"
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            Shop Now →
          </a>
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-primary-foreground/70 transition-colors hover:text-primary-foreground hover:bg-white/10"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
