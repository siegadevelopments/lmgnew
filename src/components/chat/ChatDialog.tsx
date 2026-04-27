import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";

interface ChatDialogProps {
  vendorId: string;
  vendorName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function ChatDialog({ vendorId, vendorName, isOpen, onOpenChange }: ChatDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [botProducts, setBotProducts] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Get or create conversation
  const { data: conversation, isLoading: isLoadingConv } = useQuery({
    queryKey: ["chat_conversation", user?.id, vendorId],
    queryFn: async () => {
      if (!user) return null;
      
      // Try to find existing
      let { data, error } = await (supabase
        .from("chat_conversations" as any) as any)
        .select("*")
        .eq("customer_id", user.id)
        .eq("vendor_id", vendorId)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      
      return data;
    },
    enabled: isOpen && !!user,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat_messages", conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const { data, error } = await (supabase
        .from("chat_messages" as any) as any)
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversation?.id,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat_messages", conversation.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, queryClient]);

  // Hydrate botProducts from existing messages
  useEffect(() => {
    const hydrateProducts = async () => {
      const productIds: string[] = [];
      messages.forEach(m => {
        // Use a global match to find ALL products in a message
        const matches = m.content.matchAll(/\[PRODUCT:(.*?)\]/g);
        for (const match of matches) {
          const id = match[1];
          // Strict check to avoid "undefined" string or null IDs
          if (id && id !== "undefined" && !botProducts.some((p: any) => String(p.id) === id) && !productIds.includes(id)) {
            productIds.push(id);
          }
        }
      });

      if (productIds.length > 0) {
        const { data } = await (supabase
          .from("products") as any)
          .select("id, title, price, slug, image_url, status")
          .in("id", productIds);
        
        if (data) {
          setBotProducts(prev => {
            const newProducts = [...prev];
            (data as any[]).forEach(p => {
              if (!newProducts.some(np => np.id === p.id)) {
                newProducts.push(p);
              }
            });
            return newProducts;
          });
        }
      }
    };

    if (messages.length > 0) {
      hydrateProducts();
    }
  }, [messages]);

  // Scroll to bottom on new messages or when dialog opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      // Use a small timeout to ensure content is rendered before scrolling
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, botProducts.length, isOpen]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Login required");
      
      let currentConvId = conversation?.id;
      
      // Create conversation if it doesn't exist
      if (!currentConvId) {
        const { data: newConv, error: convError } = await (supabase
          .from("chat_conversations" as any) as any)
          .insert({ customer_id: user.id, vendor_id: vendorId })
          .select()
          .single();
        if (convError) throw convError;
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: ["chat_conversation", user.id, vendorId] });
      }

      const { error: msgError } = await (supabase
        .from("chat_messages" as any) as any)
        .insert({
          conversation_id: currentConvId,
          sender_id: user.id,
          content: content,
        });
      
      if (msgError) throw msgError;

      // Update last_message_at
      await (supabase
        .from("chat_conversations" as any) as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", currentConvId);

      // --- AI CHATBOT LOGIC ---
      const { data: vendorProfile } = await (supabase
        .from("vendor_profiles") as any)
        .select("ai_enabled, ai_instructions")
        .eq("id", vendorId)
        .single();

      if (vendorProfile?.ai_enabled) {
        setIsTyping(true);

        try {
          // 1. Attempt to call the real AI Agent (Supabase Edge Function)
          const { data: aiResponse, error: aiError } = await (supabase.functions as any).invoke("ai-chat", {
            body: { 
              content: content, 
              vendor_id: vendorId,
              history: messages.slice(-5) 
            }
          });

          if (!aiError && aiResponse?.response) {
            await (supabase
              .from("chat_messages" as any) as any)
              .insert({
                conversation_id: currentConvId,
                sender_id: vendorId,
                content: aiResponse.response,
              });
            setIsTyping(false);
            return;
          }
          console.warn("LLM Agent fallback activated.");
        } catch (err) {
          console.error("AI Agent error:", err);
        }

        // 2. Fallback to Local Simulation Logic
        setTimeout(async () => {
          let botResponse = "";
          const lowerContent = content.toLowerCase();
          
          // Fetch more vendor products for better matching with ALL required fields
          const { data: allProducts } = await (supabase
            .from("products") as any)
            .select("id, title, price, slug, image_url, status")
            .eq("vendor_id", vendorId)
            .eq("status", "published")
            .limit(20);

          const productList = (allProducts || []).map(p => p.title).join(", ");
          const instructions = vendorProfile.ai_instructions || "";
          
          // Helper to find related products based on ANY keywords in content
          const findMatches = (content: string) => {
            const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const matches = (allProducts || [])
              .filter((p: any) => {
                const titleLower = p.title.toLowerCase();
                return words.some(word => titleLower.includes(word));
              })
              .slice(0, 2);
            
            if (matches.length > 0) {
              setBotProducts(prev => {
                const newProducts = [...prev];
                matches.forEach(m => {
                  if (!newProducts.some(p => p.id === m.id)) newProducts.push(m);
                });
                return newProducts;
              });
              return matches.map((p: any) => `**[PRODUCT:${p.id}]**\n*This is one of our featured products that matches your request.*`).join("\n\n");
            }
            return null;
          };

          const dynamicMatches = findMatches(lowerContent);

          // Advanced Intent Analysis using Regex for better matching
          if (/\b(price|cost|how much|\$)\b/.test(lowerContent)) {
            const productMatch = allProducts?.find((p: any) => lowerContent.includes(p.title.toLowerCase()));
            if (productMatch) {
              setBotProducts(prev => [...prev, productMatch]);
              botResponse = `The **[PRODUCT:${productMatch.id}]** is currently priced at $${productMatch.price}. It's one of our best-sellers!`;
            } else {
              botResponse = `Our prices vary depending on the item. You can see our full range in the store catalog!`;
            }
          } else if (dynamicMatches) {
             botResponse = `Yes, we have products that match your request! Here are some suggestions:\n\n${dynamicMatches}`;
          } else if (/\b(recommend|best|sell|products|collection|items)\b/.test(lowerContent)) {
            const topProducts = (allProducts || []).slice(0, 2);
            setBotProducts(prev => [...prev, ...topProducts]);
            botResponse = `I'd highly recommend these favorites from our collection:\n\n${topProducts.map((p: any) => `**[PRODUCT:${p.id}]**\n*Excellent quality and highly recommended.*`).join("\n\n")}`;
          } else if (/\b(shipping|delivery|arrive|track)\b/.test(lowerContent)) {
            botResponse = `We typically ship orders within 1-2 business days. We take great care in packaging to ensure your wellness products arrive safely.`;
          } else if (/\b(hello|hi|hey|greetings)\b/.test(lowerContent)) {
            botResponse = `Hello! I'm the wellness assistant for ${vendorName}. How can I help you find the perfect natural products today?`;
          } else {
            botResponse = `Thank you for your message! I'm the AI assistant for ${vendorName}. I couldn't find a specific match for that, but feel free to browse our full collection or ask about our shipping and prices!`;
          }
          
          const finalResponse = botResponse.trim();
          
          await (supabase
            .from("chat_messages" as any) as any)
            .insert({
              conversation_id: currentConvId,
              sender_id: vendorId, // Send as the vendor
              content: finalResponse,
            });
            
          await (supabase
            .from("chat_conversations" as any) as any)
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", currentConvId);
            
          queryClient.invalidateQueries({ queryKey: ["chat_messages", currentConvId] });
          setIsTyping(false);
        }, 1500);
      }
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", conversation?.id] });
    },
    onError: (err: any) => {
      console.error("Chat send error:", err);
      toast.error("Failed to send message: " + (err.message || "Unknown error"));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(newMessage.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-primary text-primary-foreground">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <MessageCircle className="h-4 w-4" />
            Chat with {vendorName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-4 bg-muted/30 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap",
                    isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white text-foreground rounded-tl-none border border-border"
                  )}>
                    {msg.content.split(/(\*\*\[PRODUCT:.*?\]\*\*)/g).map((part, i) => {
                      const match = part.match(/\*\*\[PRODUCT:(.*?)\]\*\*/);
                      if (match) {
                        const productId = match[1];
                        const product = botProducts.find(p => String(p.id) === productId);
                        
                        if (product) {
                          return (
                            <div key={i} className="my-4 w-full max-w-[280px]">
                              <ProductCard 
                                product={product} 
                                className="scale-90 origin-top-left shadow-lg border-primary/20" 
                              />
                            </div>
                          );
                        }
                      }
                      
                      // Fallback to Markdown link rendering if it's not a product tag
                      return part.split(/(\*\*\[.*?\]\(.*?\)\*\*)/g).map((subPart, j) => {
                        const subMatch = subPart.match(/\*\*\[(.*?)\]\((.*?)\)\*\*/);
                        if (subMatch) {
                          return (
                            <Link 
                              key={`${i}-${j}`} 
                              to={subMatch[2] as any} 
                              className="font-bold underline text-primary hover:text-primary/80 transition-colors"
                            >
                              {subMatch[1]}
                            </Link>
                          );
                        }
                        return subPart;
                      });
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="bg-white border border-border rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
            {messages.length === 0 && !isLoadingMessages && !isTyping && (
              <div className="text-center py-8">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Start a conversation with {vendorName}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 text-sm"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMessage.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
