import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_id: string;
  vendor_id: string;
  last_message_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function ChatTab({ vendorId }: { vendorId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: isLoadingConvs } = useQuery({
    queryKey: ["vendor_conversations", vendorId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chat_conversations" as any) as any)
        .select("*")
        .eq("vendor_id", vendorId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      let convs = (data || []) as Conversation[];

      if (convs.length > 0) {
        const customerIds = Array.from(
          new Set(convs.map((c) => c.customer_id).filter(Boolean))
        ) as string[];

        if (customerIds.length > 0) {
          const { data: profilesData } = await (supabase.from("profiles" as any) as any)
            .select("id, full_name, avatar_url")
            .in("id", customerIds);

          if (profilesData && profilesData.length > 0) {
            const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>(
              profilesData.map((p: any) => [
                p.id,
                { full_name: p.full_name, avatar_url: p.avatar_url },
              ])
            );
            convs = convs.map((c) => ({
              ...c,
              profiles: c.customer_id ? profileMap.get(c.customer_id) : undefined,
            }));
          }
        }
      }

      return convs;
    },
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat_messages", selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv?.id) return [];
      const { data, error } = await (supabase.from("chat_messages" as any) as any)
        .select("*")
        .eq("conversation_id", selectedConv.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConv?.id,
  });

  useEffect(() => {
    if (!vendorId) return;

    // Global subscription for all messages & deletions for this vendor
    const channel = supabase
      .channel(`vendor_global_chat:${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        async () => {
          queryClient.invalidateQueries({ queryKey: ["vendor_conversations", vendorId] });
          if (selectedConv?.id) {
            queryClient.invalidateQueries({ queryKey: ["chat_messages", selectedConv.id] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, selectedConv?.id, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedConv) return;

      const { error: msgError } = await (supabase.from("chat_messages" as any) as any).insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        content: content,
      });

      if (msgError) throw msgError;

      await (supabase.from("chat_conversations" as any) as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConv.id);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", selectedConv?.id] });
    },
    onError: (err: any) => {
      toast.error("Failed to send message: " + err.message);
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await (supabase.from("chat_messages" as any) as any)
        .delete()
        .eq("id", msgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message deleted.");
      queryClient.invalidateQueries({ queryKey: ["chat_messages", selectedConv?.id] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete message: " + err.message);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (convId: string) => {
      await (supabase.from("chat_messages" as any) as any)
        .delete()
        .eq("conversation_id", convId);

      const { error } = await (supabase.from("chat_conversations" as any) as any)
        .delete()
        .eq("id", convId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conversation deleted.");
      setSelectedConv(null);
      queryClient.invalidateQueries({ queryKey: ["vendor_conversations", vendorId] });
    },
    onError: (err: any) => {
      toast.error("Failed to delete conversation: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(newMessage.trim());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
      {/* Conversation List */}
      <Card className="md:col-span-4 overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-8 h-9 text-xs" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3",
                  selectedConv?.id === conv.id && "bg-muted",
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {conv.profiles?.avatar_url ? (
                    <img
                      src={conv.profiles.avatar_url}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold truncate">
                      {conv.profiles?.full_name || "Customer"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Click to view messages</p>
                </div>
              </button>
            ))}
            {conversations.length === 0 && !isLoadingConvs && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No conversations yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-8 overflow-hidden flex flex-col">
        {selectedConv ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">
                    {selectedConv.profiles?.full_name || "Customer"}
                  </CardTitle>
                  <CardDescription className="text-[10px]">Customer</CardDescription>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Chat
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Entire Conversation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this conversation and all associated messages. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteConversation.mutate(selectedConv.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>

            <div className="flex-1 p-4 bg-muted/20 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col group relative", isMe ? "items-end" : "items-start")}
                    >
                      <div className="flex items-center gap-1.5 max-w-[80%]">
                        {isMe && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMessage.mutate(msg.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        <div
                          className={cn(
                            "rounded-xl px-4 py-2 text-sm shadow-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-white text-foreground rounded-tl-none border border-border",
                          )}
                        >
                          {msg.content}
                        </div>

                        {!isMe && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMessage.mutate(msg.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 h-10 text-sm"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                className="h-10 px-6"
                disabled={!newMessage.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary opacity-20" />
            </div>
            <h3 className="text-lg font-bold mb-2">Customer Messages</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select a conversation from the list to view and reply to messages.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

