'use client'

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCircle2,
  Trash2,
  Mail,
  Clock,
  Sparkles,
  Bot,
  Filter,
  Check,
  RefreshCw
} from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_id?: string | null;
  vendor_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  is_support?: boolean;
  status: "open" | "resolved" | "closed";
  last_message_at: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id?: string | null;
  sender_type?: string;
  sender_name?: string | null;
  content: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function AdminMessagesTab() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"live" | "contact">("live");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);

  // Contact form messages state
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load live support conversations safely with profile hydration
  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await (supabase.from("chat_conversations" as any) as any)
        .select("*")
        .order("last_message_at", { ascending: false });

      let data = (res.data || []) as Conversation[];

      if (data.length > 0) {
        const customerIds = Array.from(
          new Set(data.map((c) => c.customer_id).filter(Boolean))
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
            data = data.map((c) => ({
              ...c,
              profiles: c.customer_id ? profileMap.get(c.customer_id) : undefined,
            }));
          }
        }
      }

      setConversations(data);

      if (data.length > 0) {
        setSelectedConv((prev) => {
          if (!prev) return data[0];
          const match = data.find((c) => c.id === prev.id);
          return match || data[0];
        });
      } else {
        setSelectedConv(null);
      }
    } catch (err) {
      console.error("Fetch convs error:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // Load contact messages
  const fetchContactMessages = async () => {
    try {
      const { data, error } = await (supabase.from("contact_messages" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setContactMessages(data as ContactMessage[]);
      }
    } catch (err) {
      console.error("Fetch contact msgs error:", err);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await (supabase.from("chat_messages" as any) as any)
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchContactMessages();

    // Subscribe to all conversations insertions/updates/deletions
    const convChannel = supabase
      .channel("admin_global_chat_convs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);

      // Subscribe to messages in current active conversation (INSERT & DELETE)
      const msgChannel = supabase
        .channel(`admin_chat_msgs:${selectedConv.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${selectedConv.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newMsg = payload.new as ChatMessage;
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as any).id;
              setMessages((prev) => prev.filter((m) => m.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
      };
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send admin reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const content = newMessage.trim();
      const { error: msgErr } = await (supabase.from("chat_messages" as any) as any).insert({
        conversation_id: selectedConv.id,
        sender_id: user?.id,
        sender_type: "admin",
        sender_name: "LMG Support",
        content: content,
      });

      if (msgErr) throw msgErr;

      // Update conversation last message timestamp & status
      await (supabase.from("chat_conversations" as any) as any)
        .update({
          last_message_at: new Date().toISOString(),
          status: "open",
        })
        .eq("id", selectedConv.id);

      setNewMessage("");
    } catch (err: any) {
      console.error("Failed to send admin message:", err);
      toast.error(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Delete single message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      const { error } = await (supabase.from("chat_messages" as any) as any)
        .delete()
        .eq("id", msgId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted.");
    } catch (err: any) {
      console.error("Delete message error:", err);
      toast.error(err.message || "Failed to delete message.");
    }
  };

  // Delete entire conversation
  const handleDeleteConversation = async (convId: string) => {
    try {
      await (supabase.from("chat_messages" as any) as any)
        .delete()
        .eq("conversation_id", convId);

      const { error } = await (supabase.from("chat_conversations" as any) as any)
        .delete()
        .eq("id", convId);

      if (error) throw error;

      setConversations((prev) => {
        const nextConvs = prev.filter((c) => c.id !== convId);
        if (selectedConv?.id === convId) {
          setSelectedConv(nextConvs[0] || null);
        }
        return nextConvs;
      });
      toast.success("Conversation deleted.");
    } catch (err: any) {
      console.error("Delete conv error:", err);
      toast.error(err.message || "Failed to delete conversation.");
    }
  };

  // Toggle status (Resolve / Reopen)
  const toggleConvStatus = async () => {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === "resolved" ? "open" : "resolved";

    try {
      const { error } = await (supabase.from("chat_conversations" as any) as any)
        .update({ status: newStatus })
        .eq("id", selectedConv.id);

      if (error) throw error;

      setSelectedConv((prev) => (prev ? { ...prev, status: newStatus } : null));
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Conversation marked as ${newStatus}.`);
    } catch (err: any) {
      toast.error("Failed to update conversation status.");
    }
  };

  // Contact messages actions
  const markContactRead = async (id: string) => {
    await (supabase.from("contact_messages" as any) as any).update({ read: true }).eq("id", id);
    setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const deleteContactMsg = async (id: string) => {
    await (supabase.from("contact_messages" as any) as any).delete().eq("id", id);
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted.");
  };

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    const name = c.profiles?.full_name || c.guest_name || "Guest Visitor";
    const email = c.guest_email || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "open") return matchesSearch && c.status !== "resolved";
    if (statusFilter === "resolved") return matchesSearch && c.status === "resolved";
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Support & Messaging Center
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Live Real-Time
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage browser live support chats, customer inquiries, and contact submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeSubTab === "live" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("live")}
            className="h-9 gap-2"
          >
            <MessageSquare className="h-4 w-4" /> Live Support Chats
          </Button>
          <Button
            variant={activeSubTab === "contact" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("contact")}
            className="h-9 gap-2 relative"
          >
            <Mail className="h-4 w-4" /> Contact Forms
            {contactMessages.filter((m) => !m.read).length > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
        </div>
      </div>

      {activeSubTab === "live" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[550px]">
          {/* Conversations List Panel */}
          <Card className="md:col-span-4 flex flex-col overflow-hidden border-border">
            <CardHeader className="p-3.5 border-b space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search live chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1 bg-muted p-0.5 rounded-lg w-full">
                  {(["open", "resolved", "all"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "flex-1 text-[11px] font-bold capitalize py-1 rounded-md transition-all text-center",
                        statusFilter === filter
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {filteredConvs.map((conv) => {
                  const displayName = conv.profiles?.full_name || conv.guest_name || "Guest Visitor";
                  const displayEmail = conv.guest_email || (conv.customer_id ? "Registered Customer" : "Anonymous Guest");
                  const isSelected = selectedConv?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={cn(
                        "w-full p-3.5 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 relative",
                        isSelected && "bg-accent/60"
                      )}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-xs font-bold truncate text-foreground">{displayName}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {conv.is_support && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-700">
                              Support
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] h-4 px-1 capitalize",
                              conv.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {conv.status || "open"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredConvs.length === 0 && !loadingConvs && (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No live support chats found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Active Chat Viewer */}
          <Card className="md:col-span-8 flex flex-col overflow-hidden border-border">
            {selectedConv ? (
              <>
                {/* Active Chat Header */}
                <CardHeader className="p-3.5 border-b flex flex-row items-center justify-between shrink-0 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {selectedConv.profiles?.full_name || selectedConv.guest_name || "Guest Visitor"}
                      </CardTitle>
                      <CardDescription className="text-[11px] flex items-center gap-2">
                        <span>{selectedConv.guest_email || (selectedConv.customer_id ? "Registered User" : "Guest Session")}</span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleConvStatus}
                      className="h-8 text-xs font-semibold gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {selectedConv.status === "resolved" ? "Reopen Chat" : "Mark Resolved"}
                    </Button>

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
                            onClick={() => handleDeleteConversation(selectedConv.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                {/* Messages Stream */}
                <div className="flex-1 p-4 bg-muted/10 overflow-y-auto" ref={scrollRef}>
                  <div className="space-y-3.5">
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_type === "admin";
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex flex-col group relative", isAdmin ? "items-end" : "items-start")}
                        >
                          <span className="text-[10px] text-muted-foreground font-semibold mb-0.5 px-1">
                            {isAdmin ? "LMG Admin Support" : (msg.sender_name || "Customer")}
                          </span>
                          <div className="flex items-center gap-1.5 max-w-[85%]">
                            {isAdmin && (
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
                                      onClick={() => handleDeleteMessage(msg.id)}
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
                                "rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-wrap leading-relaxed",
                                isAdmin
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-background text-foreground rounded-tl-none border border-border"
                              )}
                            >
                              {msg.content}
                            </div>

                            {!isAdmin && (
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
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })}

                    {messages.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-semibold">No messages in this chat thread.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Composer */}
                <form onSubmit={handleSendMessage} className="p-3 border-t bg-background flex gap-2 shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type official admin reply..."
                    className="flex-1 h-9 text-xs"
                    disabled={sending}
                  />
                  <Button type="submit" size="sm" className="h-9 px-4 font-semibold gap-1.5" disabled={!newMessage.trim() || sending}>
                    <Send className="h-3.5 w-3.5" /> Send Reply
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-10 w-10 text-primary opacity-30 mb-3" />
                <h3 className="text-base font-bold">Select a Support Conversation</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Choose a live support chat from the left panel to read and reply in real-time.
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Contact Form Messages Tab */
        <div className="space-y-4">
          {contactMessages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No contact form submissions found.
              </CardContent>
            </Card>
          ) : (
            contactMessages.map((msg) => (
              <Card
                key={msg.id}
                className={cn(
                  "border-border/50 transition-all",
                  msg.read ? "opacity-75" : "border-primary/30 bg-primary/5 shadow-sm"
                )}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-foreground">{msg.subject}</h3>
                        {!msg.read && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary">
                        {msg.name} <span className="text-muted-foreground font-normal">({msg.email})</span>
                      </p>
                      <p className="text-xs text-foreground/90 bg-background p-3 rounded-lg border border-border/50 leading-relaxed mt-2">
                        {msg.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {!msg.read && (
                        <Button variant="default" size="sm" onClick={() => markContactRead(msg.id)} className="h-8 text-xs">
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteContactMsg(msg.id)}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
