'use client'

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

const footerLinks = {
  "Shop by Goal": [
    { label: "Menopause Support", to: "/categories/menopause-support" },
    { label: "Healthy Ageing", to: "/categories/healthy-ageing" },
    { label: "Gut Health", to: "/categories/gut-health" },
    { label: "Sleep & Recovery", to: "/categories/sleep-recovery" },
    { label: "Stress Management", to: "/categories/stress-management" },
    { label: "Weight Management", to: "/categories/weight-management" },
    { label: "Heart Health", to: "/categories/heart-health" },
    { label: "Brain Health", to: "/categories/brain-health" },
    { label: "Women's Wellness", to: "/categories/womens-wellness" },
  ],
  Marketplace: [
    { label: "Browse Products", to: "/products" },
    { label: "Services", to: "/services" },
    { label: "Brands", to: "/vendors" },
    { label: "Buying Guides", to: "/guides" },
  ],
  Learn: [
    { label: "Articles", to: "/articles" },
    { label: "Videos", to: "/videos" },
    { label: "Recipes", to: "/recipes" },
    { label: "Natural Remedies", to: "/natural-remedies" },
    { label: "Studies", to: "/studies" },
    { label: "Anecdotes", to: "/anecdotes" },
    { label: "Memes", to: "/memes" },
    { label: "Charts", to: "/charts" },
  ],
  Company: [
    { label: "About Us", to: "/about" },
    { label: "Public Analytics", to: "/analytics" },
    { label: "Sell With Us", to: "/sell-with-us" },
    { label: "Contact", to: "/contact" },
    { label: "FAQ", to: "/faq" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Refund Policy", to: "/refund-policy" },
  ],
};

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/lifestylemedicinegateway",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/lifestylemedicinegateway",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/georgiaerevnidis/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.377-.293 1.192-.333 1.36-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, full_name: name } as any, { onConflict: "email" });

    if (error) {
      toast.error(error.message || "Failed to subscribe");
    } else {
      setSubscribed(true);
      setOpen(false);
      toast.success("Welcome to the community!");
    }

    setIsLoading(false);
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-primary-foreground"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-foreground">Lifestyle Medicine Gateway</span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Your trusted marketplace for health, wellness, and lifestyle medicine products and
              services.
            </p>

            {/* Footer newsletter */}
            {subscribed ? (
              <div className="mt-4 flex items-center gap-2 text-primary font-medium text-xs">
                <Sparkles className="h-3 w-3" />
                <span>Subscribed! Welcome.</span>
              </div>
            ) : (
              <div className="mt-4">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-2 px-4 shadow-sm">
                      <Mail className="h-3.5 w-3.5" />
                      Subscribe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Join Our Newsletter
                      </DialogTitle>
                      <DialogDescription>
                        Get the latest wellness tips and exclusive deals.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleNewsletterSubmit} className="space-y-4 py-4">
                      <div className="space-y-1">
                        <Label
                          htmlFor="footer-name"
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Your Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="footer-name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-9 h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="footer-email"
                          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="footer-email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-9 h-9"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-10 font-bold" disabled={isLoading}>
                        {isLoading ? "Subscribing..." : "Subscribe Now"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Social Icons */}
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-soft"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {title}
              </h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.to}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lifestyle Medicine Gateway. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/refund-policy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Refunds
            </Link>
            <Link
              href="/contact"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
