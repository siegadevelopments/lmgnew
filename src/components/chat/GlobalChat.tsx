import { useState } from "react";
import { ChatDialog } from "./ChatDialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-2xl bg-primary hover:bg-primary/90 flex items-center justify-center p-0"
            >
              <MessageCircle className="h-6 w-6 text-white" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatDialog
        vendorName="your wellness assistant"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
