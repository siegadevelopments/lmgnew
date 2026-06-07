'use client'

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

import { useBotProtection } from "@/hooks/use-bot-protection";
import { HoneypotField } from "@/components/HoneypotField";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { honeypot, setHoneypot, onInteraction, validateSubmission } = useBotProtection();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Bot protection check
    if (!validateSubmission()) {
      setSubmitted(true);
      setOpen(false);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, full_name: name } as any, { onConflict: "email" });

    if (error) {
      toast.error(error.message || "Failed to subscribe");
    } else {
      setSubmitted(true);
      setOpen(false);
      toast.success("Welcome to the community!");
    }

    setIsLoading(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-calm py-16 sm:py-20">
      {/* Animated decorative elements */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-wellness/20 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-warm/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute left-1/2 top-1/4 h-40 w-40 -translate-x-1/2 rounded-full bg-calm/10 blur-2xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
          <Mail className="h-3.5 w-3.5" />
          Stay Updated
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Get Wellness Tips & Deals
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:text-lg">
          Join 10,000+ wellness enthusiasts. Get exclusive product launches, expert articles, and
          special discounts delivered to your inbox.
        </p>

        <div className="mt-8 flex justify-center">
          {submitted ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-8 py-4 backdrop-blur-sm border border-primary-foreground/10">
              <Sparkles className="h-5 w-5 text-wellness-light" />
              <span className="text-sm font-medium text-primary-foreground">
                You're subscribed! Check your inbox.
              </span>
            </div>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 h-12 px-10 text-base font-bold shadow-xl shadow-black/10 group"
                >
                  Join the Community
                  <Mail className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Subscribe to LMG
                  </DialogTitle>
                  <DialogDescription>
                    Get the latest wellness tips and exclusive deals delivered to your inbox.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} onFocus={onInteraction} onClick={onInteraction} onKeyDown={onInteraction} className="space-y-4 py-4">
                  <HoneypotField value={honeypot} onChange={setHoneypot} />

                  <div className="space-y-2">

                    <Label
                      htmlFor="name"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Your Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Subscribing..." : "Subscribe Now"}
                  </Button>
                </form>
                <p className="text-[10px] text-center text-muted-foreground">
                  By subscribing, you agree to our terms and privacy policy. You can unsubscribe at
                  any time.
                </p>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <p className="mt-6 text-xs text-primary-foreground/50">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
