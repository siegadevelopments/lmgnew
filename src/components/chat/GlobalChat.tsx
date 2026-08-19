'use client'

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  Loader2,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { createAdminNotification } from "@/lib/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  image_url?: string | null;
  excerpt?: string | null;
  category?: string | null;
}

interface InteractiveOption {
  label: string;
  text: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id?: string | null;
  sender_type?: string; // 'user' | 'admin' | 'vendor' | 'guest'
  sender_name?: string | null;
  content: string;
  created_at: string;
  products?: ChatProduct[];
  options?: InteractiveOption[];
}

interface QuickPrompt {
  label: string;
  text: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "📚 Articles & Research", text: "Show me health articles and research studies." },
  { label: "🥗 Healthy Recipes", text: "Show me healthy recipes and nutrition guides." },
  { label: "😂 Memes & Infographics", text: "Show me wellness memes and charts." },
  { label: "🌿 Natural Remedies", text: "Show me natural remedies and holistic care." },
];

// Helper to format content cleanly without raw asterisks
function formatMessageContent(content: string) {
  // Strip all ** asterisks
  const clean = content.replace(/\*\*/g, "");
  
  // Format markdown-style links [Link Text](/url)
  const parts = clean.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          const [, text, url] = match;
          return (
            <Link
              key={index}
              href={url}
              className="text-primary font-bold underline hover:opacity-80 transition-opacity"
            >
              {text}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
}

export function GlobalChat() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dbProducts, setDbProducts] = useState<ChatProduct[]>([]);

  // Guest visitor state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestSessionId, setGuestSessionId] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load real products from website database
  useEffect(() => {
    async function loadRealProducts() {
      try {
        const { data, error } = await (supabase.from("products" as any) as any)
          .select("id, title, slug, excerpt, price, image_url, category, status")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const formatted: ChatProduct[] = data.map((p: any) => ({
            id: typeof p.id === "number" ? p.id : parseInt(p.id, 10) || Math.floor(Math.random() * 10000),
            title: p.title,
            slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            price: Number(p.price || 0),
            image_url: p.image_url || null,
            excerpt: p.excerpt || p.category || "Available on Lifestyle Medicine Gateway",
            category: p.category || "",
          }));
          setDbProducts(formatted);
        }
      } catch (err) {
        console.error("Error loading real products from DB for chat:", err);
      }
    }
    loadRealProducts();
  }, []);

  // Helper to query REAL website products asynchronously
  const getMatchingProductsAsync = async (keywords: string[]): Promise<ChatProduct[]> => {
    let source = dbProducts;
    if (source.length === 0) {
      try {
        const { data } = await (supabase.from("products" as any) as any)
          .select("id, title, slug, excerpt, price, image_url, category, status")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50);
        if (data && data.length > 0) {
          source = data.map((p: any) => ({
            id: typeof p.id === "number" ? p.id : parseInt(p.id, 10) || Math.floor(Math.random() * 10000),
            title: p.title,
            slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            price: Number(p.price || 0),
            image_url: p.image_url || null,
            excerpt: p.excerpt || p.category || "Available on Lifestyle Medicine Gateway",
            category: p.category || "",
          }));
          setDbProducts(source);
        }
      } catch (e) {
        console.error("Error fetching products async:", e);
      }
    }

    if (source.length === 0) return [];

    const matches = source.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const exc = (p.excerpt || "").toLowerCase();
      return keywords.some((kw) => title.includes(kw) || cat.includes(kw) || exc.includes(kw));
    });

    if (matches.length > 0) return matches.slice(0, 3);
    // If no keyword match found, return top published products from the website database!
    return source.slice(0, 3);
  };

  // Initialize or fetch guest session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedId = localStorage.getItem("lmg_support_guest_id");
      if (!storedId) {
        storedId = "guest_" + Math.random().toString(36).substring(2, 9) + Date.now();
        localStorage.setItem("lmg_support_guest_id", storedId);
      }
      setGuestSessionId(storedId);

      const storedInfo = localStorage.getItem("lmg_support_guest_info");
      if (storedInfo) {
        try {
          const parsed = JSON.parse(storedInfo);
          if (parsed.name) setGuestName(parsed.name);
          if (parsed.email) setGuestEmail(parsed.email);
        } catch (e) {
          console.error("Error parsing guest info:", e);
        }
      }
    }
  }, []);

  // Fetch active conversation
  const initConversation = async (forceNew = false) => {
    if (forceNew) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const currentGuestEmail = guestEmail || guestSessionId;
      let query = (supabase.from("chat_conversations" as any) as any)
        .select("*")
        .eq("is_support", true);

      if (user) {
        query = query.eq("customer_id", user.id);
      } else if (currentGuestEmail) {
        query = query.eq("guest_email", currentGuestEmail);
      } else {
        setConversationId(null);
        setMessages([]);
        return;
      }

      const { data: convs, error } = await query
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && convs && convs.length > 0) {
        setConversationId(convs[0].id);
        fetchMessages(convs[0].id);
      } else {
        setConversationId(null);
        setMessages([]);
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

      if (error) return;
      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initConversation();
    }
  }, [isOpen, user]);

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
            if (prev.some((m) => m.id === newMsg.id || (m.content === newMsg.content && m.sender_name === newMsg.sender_name))) {
              return prev;
            }
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

  // Start fresh conversation (New Chat button)
  const handleStartNewChat = () => {
    const newGuestId = "guest_" + Math.random().toString(36).substring(2, 9) + Date.now();
    localStorage.setItem("lmg_support_guest_id", newGuestId);
    setGuestSessionId(newGuestId);
    setConversationId(null);
    setMessages([]);
    toast.success("Started a new chat session with Health Guru!");
  };

  // Add product to cart handler
  const handleAddToCart = (product: ChatProduct) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.title,
      price: product.price,
      slug: product.slug,
      image: product.image_url || undefined,
    });
    toast.success(`Added ${product.title} to cart!`, {
      icon: "🛒",
      description: `$${product.price.toFixed(2)}`,
    });
  };

  // Generate Interactive Automated Response prioritizing Education & Learning Resources
  const generateAutomatedResponse = async (query: string): Promise<{ text: string; products?: ChatProduct[]; options?: InteractiveOption[] }> => {
    const q = query.toLowerCase().trim();
    const cleanQ = q.replace(/[^a-z0-9\s]/g, "");

    // 0. GREETINGS & CASUAL SMALL TALK (e.g., "Hi", "Hello", "Hey", "Good morning")
    const greetingWords = new Set(["hi", "hello", "hey", "greetings", "howdy", "sup", "yo", "hi there", "hello there", "good morning", "good afternoon", "good evening", "good day"]);
    if (greetingWords.has(cleanQ) || /^(hi+|hello+|hey+|greetings|howdy)(\s+|$)/i.test(q)) {
      return {
        text: "Hello! 👋 Welcome to Lifestyle Medicine Gateway — your premier health education & wellness platform!\n\nWhat would you like to learn or explore today? We offer a rich library of evidence-based resources:\n\n• 📝 [Articles & References](/articles) — Research-backed health guides\n• 🥗 [Healthy Recipes](/recipes) — Nourishing meal plans & ideas\n• 🎥 [Videos](/videos) — Expert masterclasses & tutorials\n• 🌿 [Natural Remedies](/natural-remedies) — Holistic lifestyle remedies\n• 🔬 [Studies](/studies) & [Anecdotes](/anecdotes) — Clinical literature & real experiences\n• 😂 [Memes](/memes) & 📊 [Charts](/charts) — Fun & visual health charts\n• 🛍️ [Marketplace Store](/products) — Curated wellness products\n\nHow can I guide your learning today?",
        options: [
          { label: "📚 Explore Articles & Research", text: "Show me health articles and research studies." },
          { label: "🥗 Discover Healthy Recipes", text: "Show me healthy recipes and nutrition guides." },
          { label: "😂 Wellness Memes & Charts", text: "Show me wellness memes and charts." },
          { label: "🌿 Natural Remedies & Care", text: "Show me natural remedies and holistic care." },
          { label: "🛍️ Browse Marketplace Store", text: "I'd like to browse products in the shop." },
        ],
      };
    }

    // BOT IDENTITY & CAPABILITIES
    if (q.includes("who are you") || q.includes("what are you") || q.includes("what can you do") || q.includes("help me") || q.includes("about") || q.includes("education")) {
      return {
        text: "🌿 Welcome to Lifestyle Medicine Gateway!\n\nWe are an evidence-based health education platform & wellness marketplace dedicated to empowering your well-being through lifestyle medicine.\n\nHere is what you can discover on our platform:\n\n• 📝 [Articles & References](/articles) — Science-backed wellness guides\n• 🥗 [Healthy Recipes](/recipes) — Easy, nutritious recipe ideas\n• 🎥 [Videos](/videos) — Masterclasses & video guides\n• 🔬 [Studies](/studies) & [Anecdotes](/anecdotes) — Clinical data & stories\n• 😂 [Memes](/memes) & 📊 [Charts](/charts) — Fun & visual health graphics\n• 🌿 [Natural Remedies](/natural-remedies) — Holistic lifestyle solutions\n• 🛍️ [Marketplace Store](/products) — Organic products & care bundles\n\nWhat topic or resource would you like to explore?",
        options: [
          { label: "📚 Explore Articles & Research", text: "Show me health articles and research studies." },
          { label: "🥗 Discover Healthy Recipes", text: "Show me healthy recipes and nutrition guides." },
          { label: "😂 Wellness Memes & Charts", text: "Show me wellness memes and charts." },
        ],
      };
    }

    // RECIPES & NUTRITION
    if (q.includes("recipe") || q.includes("cook") || q.includes("food") || q.includes("meal") || q.includes("smoothie") || q.includes("nutrition")) {
      return {
        text: "🥗 Healthy Recipes & Nutrition Guides:\n\nFuel your body with science-backed, delicious recipes tailored for gut health, hormone balance, and vitality!\n\n• 🥗 [Browse All Healthy Recipes](/recipes)\n• 🎁 [Healthy Aging Starter Kit](/healthy-aging-starter-kit)\n\nWhat type of recipe or nutrition advice are you looking for today?",
        options: [
          { label: "🥗 Gut-Friendly Recipes", text: "Show me gut-friendly recipes." },
          { label: "🌸 Hormone Support Recipes", text: "Show me recipes for hormone balance." },
          { label: "📝 Read Health Articles", text: "Show me health articles and research studies." },
        ],
      };
    }

    // MEMES, CHARTS & INFOGRAPHICS
    if (q.includes("meme") || q.includes("funny") || q.includes("chart") || q.includes("infographic") || q.includes("visual") || q.includes("joke")) {
      return {
        text: "😂 Wellness Memes & Health Infographics:\n\nLaughter and clear visuals are key pillars of lifestyle medicine! Check out our fun, relatable wellness memes and easy-to-read health charts:\n\n• 😂 [Browse Relatable Wellness Memes](/memes)\n• 📊 [Explore Health Charts & Infographics](/charts)\n\nEnjoy learning wellness in a fun, accessible way!",
        options: [
          { label: "😂 View Wellness Memes", text: "Show me wellness memes." },
          { label: "📊 View Health Charts", text: "Show me health charts." },
          { label: "📝 Read Health Articles", text: "Show me health articles and research studies." },
        ],
      };
    }

    // ARTICLES, RESEARCH, STUDIES & ANECDOTES
    if (q.includes("article") || q.includes("study") || q.includes("studies") || q.includes("anecdote") || q.includes("guide") || q.includes("research") || q.includes("learn") || q.includes("read") || q.includes("evidence")) {
      return {
        text: "📚 Evidence-Based Health Education Hub:\n\nDive into our deep library of research-backed articles, clinical studies, and real community anecdotes:\n\n• 📝 [Articles & References](/articles) — In-depth health & wellness guides\n• 🔬 [Clinical Studies](/studies) — Research-backed scientific literature\n• 📖 [Real Anecdotes](/anecdotes) — Real health journeys & community stories\n• 🎥 [Video Masterclasses](/videos) — Expert video masterclasses\n\nWhat health topic would you like to read about?",
        options: [
          { label: "🌸 Women's & Menopause Health", text: "Show me articles on women's health and menopause." },
          { label: "🦠 Gut & Digestive Health", text: "Show me articles on gut health and digestion." },
          { label: "🌙 Rest & Stress Management", text: "Show me articles on sleep and stress relief." },
        ],
      };
    }

    // NATURAL REMEDIES
    if (q.includes("remedy") || q.includes("remedies") || q.includes("natural") || q.includes("holistic") || q.includes("herbal")) {
      return {
        text: "🌿 Natural Remedies & Holistic Lifestyle Solutions:\n\nDiscover evidence-based natural remedies for daily wellness, recovery, and prevention:\n\n• 🌿 [Explore Natural Remedies](/natural-remedies)\n• 📝 [Read Holistic Health Articles](/articles)\n\nWhat specific natural remedy or health focus would you like to explore?",
        options: [
          { label: "🌸 Hormone & Women's Care", text: "Show me natural remedies for hormone care." },
          { label: "🦠 Gut & Cleanse Remedies", text: "Show me natural remedies for gut health." },
          { label: "🌙 Rest & Sleep Remedies", text: "Show me natural remedies for sleep." },
        ],
      };
    }

    // GRATITUDE & FAREWELLS
    if (q.includes("thank") || q.includes("thx") || q.includes("appreciate") || q.includes("awesome") || q.includes("great bot")) {
      return {
        text: "You're very welcome! 🌸😊 I'm always here if you need anything else. Have a wonderful and healthy day!",
      };
    }

    if (q.includes("bye") || q.includes("goodbye") || q.includes("see ya") || q.includes("have a nice day")) {
      return {
        text: "Goodbye! 🌿 Have a peaceful and healthy day ahead!",
      };
    }

    // 1. ORDER STATUS / TRACKING QUERY
    if (
      q.includes("order") || 
      q.includes("status") || 
      q.includes("track") || 
      q.includes("package") || 
      q.includes("where is my") ||
      q.includes("my purchase")
    ) {
      if (!user) {
        return {
          text: "🔐 Please Log In to Check Order Status:\n\nTo view your order history, live tracking details, and fulfillment updates, please log in to your account.\n\n👉 [Click here to Log In](/login?redirect=/profile)\n\nOnce logged in, your active orders will be displayed under My Account -> Orders!",
        };
      } else {
        return {
          text: `📦 Order Tracking:\n\nYou are logged in as ${user.email}.\n\nYou can view all your receipts and tracking numbers directly in your [My Account Orders Page](/profile).\n\n• Processing: 1-2 business days\n• Delivery: 3-5 business days`,
        };
      }
    }

    // 2. SHIPPING, DELIVERY & PRODUCT RECEIVING
    if (
      q.includes("receive") || 
      q.includes("shipping") || 
      q.includes("deliver") || 
      q.includes("courier") || 
      q.includes("post") || 
      q.includes("how long") || 
      q.includes("arrival") || 
      q.includes("arrive") || 
      q.includes("transit") || 
      q.includes("fulfillment") ||
      q.includes("get my order") ||
      q.includes("sent") ||
      q.includes("dispatch")
    ) {
      return {
        text: "🚚 Product Delivery & Fulfillment:\n\nAll orders placed on Lifestyle Medicine Gateway are processed within 1–2 business days and delivered directly to your address via standard or express courier services.\n\n• Standard Delivery: 3–5 business days ($5.99 flat rate, or FREE on orders over $50).\n• Express Shipping: 2-day priority delivery available at checkout.\n\nOnce your order ships, you will receive an email notification with your tracking number (and you can view live tracking under My Account -> Orders)!",
      };
    }

    // 3. REFUNDS & RETURNS
    if (q.includes("refund") || q.includes("return") || q.includes("exchange") || q.includes("guarantee") || q.includes("policy")) {
      return {
        text: "💳 30-Day Money-Back Guarantee:\n\nWe back all products with a 30-Day Money-Back Guarantee! If you are unsatisfied for any reason, email us at info@lifestylemedicinegateway.com or reply here to request a return label.",
      };
    }

    // 4. SPECIFIC WELLNESS CATEGORY INQUIRIES WITH REAL WEBSITE PRODUCTS & ARTICLES
    if (q.includes("gut") || q.includes("digestion") || q.includes("probiotic") || q.includes("bloat")) {
      const realProds = await getMatchingProductsAsync(["gut", "digestion", "probiotic", "cleanse", "digest", "bloat"]);
      return {
        text: "🦠 Gut & Digestive Health Hub:\nCheck out our [Gut Health Articles](/articles) & top wellness solutions available on our website:",
        products: realProds,
      };
    }

    if (q.includes("menopause") || q.includes("hormone") || q.includes("hot flash") || q.includes("women") || q.includes("pad") || q.includes("bundle")) {
      const realProds = await getMatchingProductsAsync(["menopause", "hormone", "women", "bundle", "pad", "sanitary", "care"]);
      return {
        text: "🌸 Women's Wellness & Hormone Hub:\nCheck out our [Menopause & Hormone Guides](/articles) & top care solutions available on our website:",
        products: realProds,
      };
    }

    if (q.includes("aging") || q.includes("ageing") || q.includes("nad") || q.includes("longevity") || q.includes("vitality") || q.includes("soap") || q.includes("oil")) {
      const realProds = await getMatchingProductsAsync(["aging", "ageing", "vitality", "oil", "soap", "castor", "organic"]);
      return {
        text: "✨ Healthy Ageing & Personal Care Hub:\nCheck out our [Healthy Ageing Starter Kit](/healthy-aging-starter-kit) & top care products:",
        products: realProds,
      };
    }

    if (q.includes("sleep") || q.includes("stress") || q.includes("anxiety") || q.includes("relax") || q.includes("copper") || q.includes("bracelet") || q.includes("therapy")) {
      const realProds = await getMatchingProductsAsync(["sleep", "stress", "relax", "copper", "magnetic", "bracelet", "therapy"]);
      return {
        text: "🌙 Rest & Natural Therapy Hub:\nCheck out our [Rest & Stress Relief Articles](/articles) & top therapy solutions:",
        products: realProds,
      };
    }

    // 5. GENERIC PRODUCT RECOMMENDATION INQUIRY
    if (
      q.includes("recommend") || 
      q.includes("suggest") || 
      q.includes("what should i buy") || 
      q.includes("what to buy") || 
      q.includes("best product") || 
      q.includes("product recommendation") ||
      q.includes("looking for a product") ||
      q.includes("which supplement") ||
      q.includes("what should i get")
    ) {
      return {
        text: "🌿 Health Guru Product Finder:\n\nI'd love to recommend the best products from our website store! What specific health goal or focus do you have in mind today?\n\nSelect a goal below or type your specific health concern:",
        options: [
          { label: "🌸 Women's & Hormone Care", text: "I'd like product recommendations for women's care & bundles." },
          { label: "🦠 Gut & Cleanse Solutions", text: "I'd like product recommendations for gut & body cleanse." },
          { label: "✨ Organic Castor & Skincare", text: "I'd like product recommendations for organic oils & soaps." },
          { label: "🌙 Natural Therapy & Wellness", text: "I'd like product recommendations for natural therapy & wellness." },
        ],
      };
    }

    // 6. AI SEARCH / SMART FALLBACK FOR UNMATCHED CUSTOM INQUIRIES
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: query }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          return { text: data.response };
        }
      }
    } catch (e) {
      console.warn("AI API fetch notice:", e);
    }

    // 7. GENERAL INQUIRY FALLBACK WITH EDUCATION FOCUS
    return {
      text: `🌿 Health Guru Educational Hub:\n\nI'd love to help you explore our health education resources and wellness platform!\n\nHere is where you can learn:\n• 📝 [Articles & Research](/articles)\n• 🥗 [Healthy Recipes](/recipes)\n• 🎥 [Video Masterclasses](/videos)\n• 😂 [Wellness Memes](/memes) & 📊 [Health Charts](/charts)\n• 🌿 [Natural Remedies](/natural-remedies)\n• 🛍️ [Marketplace Store](/products)`,
      options: [
        { label: "📚 Explore Articles & Research", text: "Show me health articles and research studies." },
        { label: "🥗 Discover Healthy Recipes", text: "Show me healthy recipes and nutrition guides." },
        { label: "😂 Wellness Memes & Charts", text: "Show me wellness memes and charts." },
        { label: "🛍️ Browse Shop", text: "I'd like to browse products in the shop." },
      ],
    };
  };

  // Send user message and trigger Health Guru reply with real DB products
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || newMessage).trim();
    if (!content) return;

    setLoading(true);
    setNewMessage("");

    try {
      let activeConvId = conversationId;

      // Create conversation if none exists
      if (!activeConvId) {
        let newConv = null;
        let convErr = null;
        const currentGuestName = guestName || "Guest Visitor";
        const currentGuestEmail = guestEmail || guestSessionId;

        try {
          const res = await (supabase.from("chat_conversations" as any) as any)
            .insert({
              customer_id: user?.id || null,
              guest_name: user ? null : currentGuestName,
              guest_email: user ? null : currentGuestEmail,
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

      const senderName = user ? (user.email?.split("@")[0] || "Customer") : (guestName || "Guest Visitor");
      const senderType = user ? "user" : "guest";

      // 1. Instantly display user message
      const userMsgObj: ChatMessage = {
        id: "usr_" + Date.now(),
        conversation_id: activeConvId!,
        sender_id: user?.id || null,
        sender_type: senderType,
        sender_name: senderName,
        content: content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsgObj]);

      // Synchronous insert of user message to Database
      try {
        const { error: userMsgErr } = await (supabase.from("chat_messages" as any) as any).insert({
          conversation_id: activeConvId,
          sender_id: user?.id ? user.id : null,
          sender_type: senderType,
          sender_name: senderName,
          content: content,
        });

        if (userMsgErr) {
          console.error("Failed to persist user message in DB:", userMsgErr);
        }

        await (supabase.from("chat_conversations" as any) as any)
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", activeConvId);
      } catch (e) {
        console.error("Error inserting user message:", e);
      }

      // Trigger Admin Notification
      createAdminNotification({
        type: "message",
        title: `💬 New Chat from ${senderName}`,
        message: content.length > 80 ? content.substring(0, 80) + "..." : content,
        link: "/admin?tab=messages",
        metadata: { conversation_id: activeConvId, sender_name: senderName },
      });

      // 2. Trigger Health Guru Interactive Answer with REAL DB products
      setIsBotTyping(true);

      setTimeout(async () => {
        const botResponse = await generateAutomatedResponse(content);

        const botMsgObj: ChatMessage = {
          id: "guru_" + Date.now(),
          conversation_id: activeConvId!,
          sender_id: null,
          sender_type: "admin",
          sender_name: "Health Guru",
          content: botResponse.text,
          products: botResponse.products,
          options: botResponse.options,
          created_at: new Date().toISOString(),
        };

        // Display Health Guru interactive answer
        setMessages((prev) => [...prev, botMsgObj]);
        setIsBotTyping(false);

        // Synchronous persistence of bot response
        try {
          const { error: botMsgErr } = await (supabase.from("chat_messages" as any) as any).insert({
            conversation_id: activeConvId,
            sender_id: null,
            sender_type: "admin",
            sender_name: "Health Guru",
            content: botResponse.text,
          });

          if (botMsgErr) {
            console.error("Failed to persist bot response in DB:", botMsgErr);
          }
        } catch (botErr) {
          console.error("Notice: Health Guru DB background insert notice:", botErr);
        }
      }, 400);

    } catch (err: any) {
      console.error("Failed to send support message:", err);
      toast.error(err.message || "Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPromptClick = (promptText: string) => {
    handleSendMessage(promptText);
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
            className="mb-4 w-[92vw] sm:w-[390px] h-[560px] max-h-[85vh] rounded-2xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 text-primary-foreground flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xs leading-tight text-white flex items-center gap-1.5">
                    Health Guru AI
                    <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-white/80 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Online 24/7 • Interactive Wellness Bot
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartNewChat}
                  title="Start New Chat"
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-3.5 bg-muted/10 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4">
                {/* Welcome message */}
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[86%] rounded-2xl rounded-tl-none bg-background border border-border p-3 text-xs shadow-sm space-y-1.5">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      👋 Welcome! I am Health Guru
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      I'm your 24/7 Wellness & Product Assistant. Ask me anything about products, recipes, shipping, or health topics! (For Order Status, please log in).
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                {messages.map((msg) => {
                  const isMe = msg.sender_type === "user" || msg.sender_type === "guest" || msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col space-y-2", isMe ? "items-end" : "items-start")}
                    >
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground font-semibold px-1 flex items-center gap-1">
                          <Bot className="h-3 w-3 text-primary" /> Health Guru
                        </span>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm whitespace-pre-wrap break-words leading-relaxed",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-background text-foreground rounded-tl-none border border-border"
                        )}
                      >
                        {formatMessageContent(msg.content)}
                      </div>

                      {/* Interactive Options Chips if present */}
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-w-[92%] pl-1 pt-1">
                          {msg.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSendMessage(opt.text)}
                              className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              {opt.label}
                              <ChevronRight className="h-3 w-3 opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Rich Interactive Product Cards Grid */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="w-full pl-1 pt-1 space-y-2 max-w-[95%]">
                          <div className="grid grid-cols-1 gap-2.5">
                            {msg.products.map((prod) => (
                              <div
                                key={prod.id}
                                className="bg-background rounded-xl border border-border p-3 shadow-sm flex gap-3 items-center hover:border-primary/40 transition-all group"
                              >
                                {prod.image_url && (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.title}
                                    className="h-16 w-16 rounded-lg object-cover bg-muted shrink-0 border border-border/50 group-hover:scale-105 transition-transform"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-bold text-foreground truncate leading-tight mb-0.5">
                                    {prod.title}
                                  </h5>
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1.5">
                                    {prod.excerpt}
                                  </p>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-primary">
                                      ${prod.price.toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Link
                                        href={`/products/${prod.slug}`}
                                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted/50 hover:bg-muted"
                                      >
                                        View <ExternalLink className="h-2.5 w-2.5" />
                                      </Link>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddToCart(prod)}
                                        className="h-7 text-[10px] font-bold px-2.5 gap-1 shadow-sm"
                                      >
                                        <ShoppingCart className="h-3 w-3" /> Add
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <span className="text-[9px] text-muted-foreground px-1 flex items-center gap-1">
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
                    <span>Health Guru is finding product recommendations...</span>
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
                placeholder="Ask Health Guru anything..."
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
              Chat with Health Guru AI
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
          aria-label="Open Health Guru Chat"
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
