import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, CheckCircle2, Star, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function AppInstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has already dismissed it this session
      const isDismissed = localStorage.getItem("pwa-install-dismissed");
      if (!isDismissed) {
        // Show the popup after a 5 second delay for better engagement
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-card rounded-[2rem] overflow-hidden shadow-2xl border border-border/50"
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Preview Image Section */}
              <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-muted p-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <motion.img 
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  src="/app-preview.png" 
                  alt="App Preview" 
                  className="w-full h-full object-contain drop-shadow-2xl z-0"
                />
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-10 right-6 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-lg border border-border/50"
                >
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-10 left-6 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-lg border border-border/50"
                >
                  <Smartphone className="h-4 w-4 text-primary" />
                </motion.div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  <Zap className="h-3 w-3 fill-primary" /> Premium Experience
                </div>
                
                <h3 className="text-2xl font-black tracking-tight mb-2 leading-tight">
                  Take LMG with you anywhere.
                </h3>
                
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Install the Lifestyle Medicine Gateway app for faster access, offline reading, and exclusive wellness updates.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Instant access from home screen</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Full wellness resource library</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Secure & Private</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 gap-2"
                  >
                    <Download className="h-4 w-4" /> Install Now
                  </Button>
                  <button 
                    onClick={handleDismiss}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-center py-2"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
