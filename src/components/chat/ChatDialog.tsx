import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const { data: conversation } = useQuery({
    queryKey: ["chat_conversation", user?.id, vendorId],
    queryFn: async () => {
      if (!user) return null;

      // Try to find existing conversation
      const { data, error } = await (supabase
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

  // Realtime subscription for new messages
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

    return () => { supabase.removeChannel(channel); };
  }, [conversation?.id, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Please log in to send messages");

      let currentConvId = conversation?.id;

      // Create conversation if it doesn't exist yet
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

      // Insert the message
      const { error: msgError } = await (supabase
        .from("chat_messages" as any) as any)
        .insert({
          conversation_id: currentConvId,
          sender_id: user.id,
          content,
        });

      if (msgError) throw msgError;

      // Update last_message_at on the conversation
      await (supabase
        .from("chat_conversations" as any) as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", currentConvId);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", conversation?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(newMessage.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] h-[580px] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <DialogHeader className="bg-primary p-4 text-white flex-row items-center gap-3 space-y-0 shrink-0">
          <div className="bg-white/20 p-2 rounded-full">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-white text-sm font-bold">
              Chat with {vendorName}
            </DialogTitle>
            <p className="text-[10px] text-white/70">
              Send a message — the vendor will reply shortly
            </p>
          </div>
        </DialogHeader>

        <div className="sr-only">
          <DialogDescription>Direct message conversation with {vendorName}.</DialogDescription>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 bg-muted/30 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-3">
            {isLoadingMessages && (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap break-words",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white text-foreground rounded-tl-none border border-border"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}

            {messages.length === 0 && !isLoadingMessages && (
              <div className="text-center py-10">
                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Start a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send a message to {vendorName} and they'll get back to you soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t bg-white flex items-center gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${vendorName}...`}
            className="flex-1 h-10 text-sm"
            disabled={sendMessage.isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
