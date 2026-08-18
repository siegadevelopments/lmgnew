'use client'

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot, 
  CheckCheck, 
  Sparkles, 
  Headphones,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createAdminNotification } from "@/lib/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id?: string | null;
  sender_type?: string; // 'user' | 'admin' | 'vendor' | 'guest'
  sender_name?: string | null;
  content: string;
  created_at: string;
}

interface QuickPrompt {
  label: string;
  text: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "📦 Order Status", text: "Hi, I'd like to check the status of my order." },
  { label: "🚚 Shipping Info", text: "How long does shipping take and what are the delivery options?" },
  { label: "🌿 Product Recommendation", text: "Can you recommend supplements for gut health and stress?" },
  { label: "💳 Refund & Returns", text: "What is your refund and return policy?" },
];

export function GlobalChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Guest visitor state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestSaved, setGuestSaved] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load guest info from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedId = localStorage.getItem("lmg_support_guest_id");
      if (!storedId) {
        storedId = "guest_" + Math.random().toString(36).substring(2, 11) + Date.now();
        localStorage.setItem("lmg_support_guest_id", storedId);
      }
      setGuestSessionId(storedId);

      const storedInfo = localStorage.getItem("lmg_support_guest_info");
      if (storedInfo) {
        try {
          const parsed = JSON.parse(storedInfo);
          if (parsed.name) setGuestName(parsed.name);
          if (parsed.email) setGuestEmail(parsed.email);
          if (parsed.name && parsed.email) setGuestSaved(true);
        } catch (e) {
          console.error("Error parsing guest info:", e);
        }
      }
    }
  }, []);

  // Fetch or initialize conversation with schema resilience
  const initConversation = async () => {
    setLoading(true);
    try {
      let { data: convs, error } = await (supabase.from("chat_conversations" as any) as any)
        .select("*")
        .eq("is_support", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.warn("Retrying conversation fetch without extended columns:", error.message);
        if (user) {
          const fallbackRes = await (supabase.from("chat_conversations" as any) as any)
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);
          convs = fallbackRes.data;
        } else {
          const fallbackRes = await (supabase.from("chat_conversations" as any) as any)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);
          convs = fallbackRes.data;
        }
      }

      if (convs && convs.length > 0) {
        setConversationId(convs[0].id);
        fetchMessages(convs[0].id);
      }
    } catch (err) {
      console.error("Init conversation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await (supabase.from("chat_messages" as any) as any)
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initConversation();
    }
  }, [isOpen, user, guestSaved]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`support_chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (!isOpen && (newMsg.sender_type === "admin" || !newMsg.sender_id)) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen]);

  // Auto-scroll message stream
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping, isOpen]);

  // Handle guest registration form submit
  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      toast.error("Please enter your name and email to start chatting.");
      return;
    }
    localStorage.setItem(
      "lmg_support_guest_info",
      JSON.stringify({ name: guestName.trim(), email: guestEmail.trim() })
    );
    setGuestSaved(true);
  };

  // Generate Smart Automated Assistant Response
  const generateAutomatedResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes("order") || q.includes("status") || q.includes("track")) {
      return "📦 **Order Status**: You can view your current order status and tracking details under your **My Account -> Orders** page! Standard order processing takes 1-2 business days, and shipping takes 3-5 business days. An admin team member has also been notified of your request!";
    }

    if (q.includes("shipping") || q.includes("deliver") || q.includes("how long")) {
      return "🚚 **Shipping & Delivery**: We offer **FREE Standard Shipping** on all orders over $50! Standard shipping takes 3–5 business days across the US. Express 2-day delivery options are available at checkout.";
    }

    if (q.includes("product") || q.includes("recommend") || q.includes("supplement") || q.includes("gut") || q.includes("menopause") || q.includes("aging") || q.includes("stress")) {
      return "🌿 **Wellness Recommendations**: Our top physician-curated formulas include:\n- **Gut Health**: High-Potency Probiotics & Prebiotic Fiber\n- **Menopause Support**: Herbal Phytoestrogen & Balance Blends\n- **Stress & Sleep**: Ashwagandha, L-Theanine & Magnesium Glycinate\n\nFeel free to explore our **Shop All** section or let us know if you need specific ingredient guidance!";
    }

    if (q.includes("refund") || q.includes("return") || q.includes("exchange") || q.includes("policy")) {
      return "💳 **Returns & Refunds**: We back all products with a **30-Day Money-Back Guarantee**! If you are unsatisfied for any reason, you can request a full refund or exchange by emailing info@lifestylemedicinegateway.com or chatting with us right here.";
    }

    return `👋 Thanks for reaching out! I'm the **LMG Support AI Assistant**. \n\nI have received your message: *"${query}"* and dispatched a notification to our platform support team. An admin specialist will review and reply shortly! Is there anything else I can help you with in the meantime?`;
  };

  // Send user message and trigger automated AI reply
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || newMessage).trim();
    if (!content) return;

    if (!user && !guestSaved && !guestName && !guestEmail) {
      setGuestSaved(false);
    }

    setLoading(true);
    setNewMessage("");

    try {
      let activeConvId = conversationId;

      // Create conversation if none exists
      if (!activeConvId) {
        let newConv = null;
        let convErr = null;

        try {
          const res = await (supabase.from("chat_conversations" as any) as any)
            .insert({
              customer_id: user?.id || null,
              guest_name: user ? null : (guestName || "Guest Visitor"),
              guest_email: user ? null : (guestEmail || guestSessionId),
              is_support: true,
              status: "open",
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();
          newConv = res.data;
          convErr = res.error;
        } catch (e: any) {
          convErr = e;
        }

        if (convErr || !newConv) {
          let fallbackRes = await (supabase.from("chat_conversations" as any) as any)
            .insert({
              customer_id: user?.id || null,
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (fallbackRes.error) throw fallbackRes.error;
          newConv = fallbackRes.data;
        }

        activeConvId = newConv.id;
        setConversationId(newConv.id);
      }

      const senderName = user ? (user.email?.split("@")[0] || "Customer") : (guestName || "Guest");
      const senderType = user ? "user" : "guest";

      // 1. Insert User Message
      let insertedUserMsg = null;
      try {
        const res = await (supabase.from("chat_messages" as any) as any)
          .insert({
            conversation_id: activeConvId,
            sender_id: user?.id || null,
            sender_type: senderType,
            sender_name: senderName,
            content: content,
          })
          .select()
          .single();
        insertedUserMsg = res.data;
      } catch (e) {
        const fallbackRes = await (supabase.from("chat_messages" as any) as any)
          .insert({
            conversation_id: activeConvId,
            sender_id: user?.id || null,
            content: content,
          })
          .select()
          .single();
        insertedUserMsg = fallbackRes.data;
      }

      if (insertedUserMsg) {
        setMessages((prev) => [...prev, insertedUserMsg as ChatMessage]);
      }

      // Update conversation timestamp
      try {
        await (supabase.from("chat_conversations" as any) as any)
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", activeConvId);
      } catch (e) {}

      // Trigger Admin Notification
      createAdminNotification({
        type: "message",
        title: `💬 New Support Chat from ${senderName}`,
        message: content.length > 80 ? content.substring(0, 80) + "..." : content,
        link: "/admin?tab=messages",
        metadata: { conversation_id: activeConvId, sender_name: senderName },
      });

      // 2. Trigger Automated Assistant Reply
      setIsBotTyping(true);

      setTimeout(async () => {
        const botReplyText = generateAutomatedResponse(content);

        try {
          const { data: botMsg } = await (supabase.from("chat_messages" as any) as any)
            .insert({
              conversation_id: activeConvId,
              sender_id: null,
              sender_type: "admin",
              sender_name: "LMG Support AI",
              content: botReplyText,
            })
            .select()
            .single();

          if (botMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === botMsg.id)) return prev;
              return [...prev, botMsg as ChatMessage];
            });
          }
        } catch (botErr) {
          console.warn("Could not persist bot reply in DB:", botErr);
          // Local fallback render
          setMessages((prev) => [
            ...prev,
            {
              id: "bot_" + Date.now(),
              conversation_id: activeConvId!,
              sender_type: "admin",
              sender_name: "LMG Support AI",
              content: botReplyText,
              created_at: new Date().toISOString(),
            },
          ]);
        } finally {
          setIsBotTyping(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error("Failed to send support message:", err);
      toast.error(err.message || "Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPromptClick = (promptText: string) => {
    if (!user && !guestSaved) {
      setNewMessage(promptText);
    } else {
      handleSendMessage(promptText);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4 w-[92vw] sm:w-[380px] h-[540px] max-h-[85vh] rounded-2xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3.5 text-primary-foreground flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                    LMG Live Support
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-white/80 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Online 24/7 • Instant AI Answers
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Guest Entry Form */}
            {!user && !guestSaved ? (
              <div className="p-5 flex-1 flex flex-col justify-center bg-muted/20">
                <div className="bg-background border border-border rounded-xl p-5 shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-foreground text-base">Chat with Support</h4>
                    <p className="text-xs text-muted-foreground">
                      Please enter your details below so we can assist you with your order or questions.
                    </p>
                  </div>

                  <form onSubmit={handleSaveGuest} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Your Name
                      </label>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Your Email
                      </label>
                      <Input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="e.g. jane@example.com"
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full h-9 text-xs font-semibold">
                      Start Live Chat
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Stream */}
                <div className="flex-1 p-4 bg-muted/10 overflow-y-auto" ref={scrollRef}>
                  <div className="space-y-3.5">
                    {/* Welcome message */}
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-background border border-border p-3 text-xs shadow-sm space-y-1">
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          👋 Welcome to Lifestyle Medicine Gateway!
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          I am your 24/7 LMG Support Assistant. How can I help you today? Select a quick topic below or type your question!
                        </p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    {messages.map((msg) => {
                      const isMe = msg.sender_type === "user" || msg.sender_type === "guest" || msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                        >
                          {!isMe && (
                            <span className="text-[10px] text-muted-foreground font-semibold mb-0.5 px-1 flex items-center gap-1">
                              <Bot className="h-3 w-3 text-primary" /> {msg.sender_name || "LMG Support"}
                            </span>
                          )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm whitespace-pre-wrap break-words leading-relaxed",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-background text-foreground rounded-tl-none border border-border"
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                          </span>
                        </div>
                      );
                    })}

                    {/* Bot Typing Indicator */}
                    {isBotTyping && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background border border-border p-2.5 rounded-2xl rounded-tl-none max-w-[70%]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>LMG Support AI is typing...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Prompts Chip Carousel */}
                {messages.length < 2 && (
                  <div className="px-3 py-2 bg-background border-t border-border/50 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPromptClick(qp.text)}
                        className="whitespace-nowrap rounded-full bg-accent/60 hover:bg-accent text-[11px] font-medium text-foreground px-3 py-1 border border-border transition-colors shrink-0"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Composer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-background border-t border-border flex items-center gap-2 shrink-0"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 h-9 text-xs bg-muted/20"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={!newMessage.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <div className="relative">
        <AnimatePresence>
          {hovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              className="absolute right-16 top-1.5 whitespace-nowrap rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Chat with 24/7 AI Support
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            setUnreadCount(0);
          }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all border-2 border-white/20"
          aria-label="Open Live Support Chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white text-[9px] font-black text-white items-center justify-center">
                  {unreadCount > 0 ? unreadCount : ""}
                </span>
              </span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// Compatibility Export
export function MessengerBubble() {
  return <GlobalChat />;
}
