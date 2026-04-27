import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [isTyping, setIsTyping] = useState(false);

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
        // Simulate thinking time
        setTimeout(async () => {
          let botResponse = "";
          const lowerContent = content.toLowerCase();
          
          if (lowerContent.includes("price") || lowerContent.includes("how much")) {
            botResponse = `Thanks for asking about our products! ${vendorProfile.ai_instructions || "Please check our product catalog for the latest pricing and details."}`;
          } else if (lowerContent.includes("shipping") || lowerContent.includes("delivery")) {
            botResponse = `We strive for fast delivery! ${vendorProfile.ai_instructions || "Orders are typically processed within 1-2 business days."}`;
          } else if (lowerContent.includes("hello") || lowerContent.includes("hi")) {
            botResponse = `Hello there! I'm the AI assistant for ${vendorName}. How can I help you with our wellness products today?`;
          } else {
            botResponse = vendorProfile.ai_instructions || `Thank you for your message! Our team at ${vendorName} will get back to you as soon as possible. In the meantime, how else can I assist you?`;
          }
          
          await (supabase
            .from("chat_messages" as any) as any)
            .insert({
              conversation_id: currentConvId,
              sender_id: vendorId, // Send as the vendor
              content: botResponse,
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
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white text-foreground rounded-tl-none border border-border"
                  )}>
                    {msg.content}
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
