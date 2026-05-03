import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Replace with your actual Facebook Page ID or Messenger link
// You can get this from: https://www.facebook.com/your-page-name
// Messenger URL format: https://m.me/YOUR_PAGE_USERNAME
const FACEBOOK_MESSENGER_URL = "https://m.me/lifestylemedicinegateway";

export function MessengerBubble() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-[74px] right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mb-1 rounded-xl bg-white px-4 py-2.5 shadow-xl border border-border text-sm font-medium text-foreground whitespace-nowrap"
          >
            💬 Chat with us on Messenger
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={FACEBOOK_MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on Facebook Messenger"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl bg-[#0084FF] hover:bg-[#0078e7] transition-colors"
      >
        {/* Facebook Messenger icon */}
        <svg viewBox="0 0 36 36" fill="white" className="h-7 w-7">
          <path d="M18 2C9.163 2 2 8.775 2 17.1c0 4.593 1.946 8.716 5.102 11.618V34l4.868-2.676A16.96 16.96 0 0018 32.2c8.837 0 16-6.775 16-15.1S26.837 2 18 2zm1.598 20.316l-4.073-4.342-7.944 4.342 8.741-9.28 4.172 4.342 7.846-4.342-8.742 9.28z" />
        </svg>

        {/* Pulse ring */}
        <span className="absolute flex h-14 w-14">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0084FF] opacity-30" />
        </span>
      </motion.a>
    </div>
  );
}

// Keep backward compatibility with old import
export function GlobalChat() { return <MessengerBubble />; }
