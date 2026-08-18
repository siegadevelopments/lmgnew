'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  ShoppingBag, 
  MessageSquare, 
  Package, 
  Store, 
  CheckCheck, 
  ChevronRight,
  Sparkles,
  Layers
} from "lucide-react";
import { 
  fetchAdminNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  NotificationItem 
} from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const typeIcons = {
  order: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
  message: <MessageSquare className="h-4 w-4 text-blue-500" />,
  content: <Package className="h-4 w-4 text-purple-500" />,
  vendor: <Store className="h-4 w-4 text-amber-500" />,
  system: <Sparkles className="h-4 w-4 text-indigo-500" />,
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchAdminNotifications(20);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("admin_notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setIsOpen(false);

    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Admin Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 text-[10px] font-black text-white items-center justify-center border border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-2xl border-border overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-foreground">Admin Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications Stream */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={cn(
                "w-full p-3 text-left transition-colors flex items-start gap-3 hover:bg-accent/50",
                !n.read ? "bg-primary/5 font-medium" : "opacity-80"
              )}
            >
              <div className="p-2 rounded-full bg-muted shrink-0 mt-0.5">
                {typeIcons[n.type] || <Layers className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                  <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>
              {!n.read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </button>
          ))}

          {notifications.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground space-y-1">
              <Bell className="h-7 w-7 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-semibold">No notifications yet</p>
              <p className="text-[11px] opacity-70">You will be notified when orders, messages, or content updates arrive.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-muted/20 border-t border-border text-center">
          <Link
            href="/admin?tab=overview"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            View Dashboard Overview <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
