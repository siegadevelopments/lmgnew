import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";

interface ChatDialogProps {
  vendorId?: string; // Optional for global mode
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

  const effectiveVendorId = vendorId || "00000000-0000-0000-0000-000000000000";

  // Get or create conversation
  const { data: conversation, isLoading: isLoadingConv } = useQuery({
    queryKey: ["chat_conversation", user?.id, vendorId || "global"],
    queryFn: async () => {
      if (!user) return null;
      
      let targetVendorId = vendorId;

      // If no vendorId, find the first available vendor to host the global chat
      if (!targetVendorId) {
        const { data: firstVendor } = await supabase
          .from("vendor_profiles")
          .select("id")
          .eq("is_approved", true)
          .limit(1)
          .single();
        
        if (firstVendor) {
          targetVendorId = firstVendor.id;
        } else {
          // Fallback if no vendors exist at all
          return null;
        }
      }
      
      // Try to find existing
      let { data, error } = await (supabase
        .from("chat_conversations" as any) as any)
        .select("*")
        .eq("customer_id", user.id)
        .eq("vendor_id", targetVendorId)
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
      let targetVendorId = vendorId;

      // Find a host vendor for global chat if needed
      if (!targetVendorId) {
        const { data: firstVendor } = await supabase
          .from("vendor_profiles")
          .select("id")
          .eq("is_approved", true)
          .limit(1)
          .single();
        if (!firstVendor) throw new Error("No vendors available to host chat");
        targetVendorId = firstVendor.id;
      }

      // Create conversation if it doesn't exist
      if (!currentConvId) {
        const { data: newConv, error: convError } = await (supabase
          .from("chat_conversations" as any) as any)
          .insert({ customer_id: user.id, vendor_id: targetVendorId })
          .select()
          .single();
        if (convError) throw convError;
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: ["chat_conversation", user.id, vendorId || "global"] });
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
      setIsTyping(true);

      try {
        // 1. Attempt to call the real AI Agent
        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: content, 
            vendor_id: vendorId, 
            history: messages.slice(-5) 
          })
        });

        const aiData = await response.json();

        if (response.ok && aiData?.response) {
          await (supabase
            .from("chat_messages" as any) as any)
            .insert({
              conversation_id: currentConvId,
              sender_id: targetVendorId,
              content: aiData.response,
            });
          setIsTyping(false);
          return;
        }
          
        const errorMessage = aiData?.error || "Unknown server error";
        console.warn(`AI Agent failed: ${errorMessage}. Falling back to simulation.`);
      } catch (err: any) {
        console.error("AI Agent error:", err);
      }

      // 2. Fallback to Local Simulation Logic
      setTimeout(async () => {
        let botResponse = "";
        const lowerContent = content.toLowerCase();
        
        // Fetch products for matching
        const { data: allProducts } = await (supabase
          .from("products") as any)
          .select("id, title, price, slug, image_url, status")
          .eq("status", "published")
          .limit(20);

        // Helper to find related products
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
            return matches.map((p: any) => `**[PRODUCT:${p.id}]**\n*One of our recommendations.*`).join("\n\n");
          }
          return null;
        };

        const dynamicMatches = findMatches(lowerContent);

        if (/\b(price|cost|how much|\$)\b/.test(lowerContent)) {
          const productMatch = allProducts?.find((p: any) => lowerContent.includes(p.title.toLowerCase()));
          if (productMatch) {
            setBotProducts(prev => [...prev, productMatch]);
            botResponse = `The **[PRODUCT:${productMatch.id}]** is priced at $${productMatch.price}.`;
          } else {
            botResponse = `Our prices vary by item. You can see the full catalog for details!`;
          }
        } else if (dynamicMatches) {
           botResponse = `I found these products for you:\n\n${dynamicMatches}`;
        } else if (/\b(hello|hi|hey)\b/.test(lowerContent)) {
          botResponse = `Hello! I'm your wellness assistant for ${vendorName}. How can I help?`;
        } else {
          botResponse = `I'd love to help you find something at ${vendorName}! Tell me more about what you're looking for.`;
        }
        
        const finalResponse = botResponse.trim();
        
        await (supabase
          .from("chat_messages" as any) as any)
          .insert({
            conversation_id: currentConvId,
            sender_id: targetVendorId,
            content: finalResponse,
          });
          
        setIsTyping(false);
      }, 1000);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", conversation?.id] });
    },
    onError: (err: any) => {
      console.error("Chat send error:", err);
      toast.error("Failed to send message");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(newMessage.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] h-[600px] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-primary p-4 text-white flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-sm font-bold">Chat with {vendorName}</DialogTitle>
              <p className="text-[10px] text-white/70">Online • AI Assistant v2.0</p>
            </div>
          </div>
        </DialogHeader>
        
        {/* Hidden description for accessibility */}
        <div className="sr-only">
          <DialogDescription>Chat conversation with {vendorName} AI wellness assistant.</DialogDescription>
        </div>
        
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

        <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex items-center gap-2">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Future: Add image preview and base64 handling
              }
            }}
          />
          <label 
            htmlFor="image-upload"
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            title="Upload image (Meme, Chart, etc.)"
          >
            <ImageIcon className="h-5 w-5 text-gray-500" />
          </label>
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message or describe an image..."
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
