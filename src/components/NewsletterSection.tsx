import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    await supabase.from("newsletter_subscribers").upsert({ email } as any, { onConflict: "email" });
    setSubmitted(true);
    setIsLoading(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-calm py-16 sm:py-20">
      {/* Animated decorative elements */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-wellness/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-warm/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute left-1/2 top-1/4 h-40 w-40 -translate-x-1/2 rounded-full bg-calm/10 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Stay Updated
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
          Get Wellness Tips & Deals
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
          Join 10,000+ wellness enthusiasts. Get exclusive product launches,
          expert articles, and special discounts delivered to your inbox.
        </p>

        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-6 py-4 backdrop-blur-sm">
            <svg className="h-5 w-5 text-wellness-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-primary-foreground">
              You're subscribed! Check your inbox.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-background text-foreground hover:bg-background/90 shrink-0"
            >
              {isLoading ? "..." : "Subscribe"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-xs text-primary-foreground/50">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
