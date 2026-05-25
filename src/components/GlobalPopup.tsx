'use client'

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Popup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_type: "url" | "email";
  cta_url: string | null;
  cta_button_text: string;
  display_delay: number;
}

export function GlobalPopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function checkPopups() {
      const isPreview = searchParams.get("preview_popup") === "true";

      // Check if user has already dismissed a popup in this session
      const lastDismissed = localStorage.getItem("lmg_popup_dismissed");
      const sessionDismissed = sessionStorage.getItem("lmg_popup_session_dismissed");

      // Only skip if not in preview mode
      if (!isPreview && sessionDismissed) return;

      const { data, error } = await supabase
        .from("popups" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const popupData = data as any;

        // Skip if this specific popup was already dismissed (unless previewing)
        if (!isPreview && lastDismissed === popupData.id) return;

        setTimeout(
          () => {
            setPopup(popupData);
            setIsOpen(true);
          },
          isPreview ? 0 : popupData.display_delay || 3000,
        );
      }
    }

    checkPopups();
  }, [pathname, searchParams]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (popup) {
      localStorage.setItem("lmg_popup_dismissed", popup.id);
      sessionStorage.setItem("lmg_popup_session_dismissed", "true");
    }
  };

  const handleCTA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!popup) return;

    if (popup.cta_type === "url" && popup.cta_url) {
      handleDismiss();
      if (popup.cta_url.startsWith("http")) {
        window.open(popup.cta_url, "_blank");
      } else {
        router.push(popup.cta_url);
      }
    } else if (popup.cta_type === "email") {
      if (!email) return;
      setIsSubmitting(true);
      const { error } = await (supabase.from("newsletter_subscribers") as any).upsert(
        { email },
        { onConflict: "email" },
      );

      setIsSubmitting(false);
      if (error) {
        toast.error("Failed to subscribe. Please try again.");
      } else {
        setIsSubscribed(true);
        toast.success("Welcome to the community!");
        setTimeout(() => handleDismiss(), 3000);
      }
    }
  };

  if (!popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col">
          {popup.image_url && (
            <div className="relative h-64 w-full">
              <Image 
                src={popup.image_url} 
                alt={popup.title} 
                fill
                className="h-full w-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="p-8 text-center space-y-4">
            {!popup.image_url && (
              <div className="flex justify-end -mt-4 -mr-4">
                <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <DialogHeader className="space-y-2">
              <DialogTitle className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                {popup.title}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                {popup.content}
              </DialogDescription>
            </DialogHeader>

            {popup.cta_type === "email" ? (
              <div className="pt-4">
                {isSubscribed ? (
                  <div className="bg-emerald-500/10 text-emerald-600 rounded-xl py-4 flex flex-col items-center gap-2 animate-in zoom-in-95">
                    <CheckCircle2 className="h-8 w-8" />
                    <p className="font-bold">You're on the list!</p>
                  </div>
                ) : (
                  <form onSubmit={handleCTA} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="Enter your email address"
                        className="pl-10 h-12 text-base shadow-inner"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Joining..." : popup.cta_button_text}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="pt-6">
                <Button
                  onClick={() => handleCTA()}
                  className="w-full h-14 text-lg font-black tracking-wide shadow-xl shadow-primary/20 group"
                >
                  {popup.cta_button_text}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground pt-4 uppercase tracking-widest font-bold opacity-50">
              Lifestyle Medicine Gateway • Wellness Community
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
