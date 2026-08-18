import { supabase } from "@/integrations/supabase/client";

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  recipient_role: string;
  type: "order" | "message" | "content" | "vendor" | "system";
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

export async function createAdminNotification({
  type,
  title,
  message,
  link,
  metadata = {},
}: {
  type: "order" | "message" | "content" | "vendor" | "system";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data, error } = await (supabase.from("notifications" as any) as any)
      .insert({
        recipient_role: "admin",
        type,
        title,
        message,
        link: link || null,
        metadata,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.warn("Could not insert notification into table:", error.message);
    }
    return data;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
}

export async function fetchAdminNotifications(limit = 30): Promise<NotificationItem[]> {
  try {
    const { data, error } = await (supabase.from("notifications" as any) as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Could not fetch notifications:", error.message);
      return [];
    }
    return (data || []) as NotificationItem[];
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { error } = await (supabase.from("notifications" as any) as any)
      .update({ read: true })
      .eq("id", id);

    if (error) console.warn("Failed to mark notification as read:", error.message);
  } catch (err) {
    console.error("Error updating notification read status:", err);
  }
}

export async function markAllNotificationsRead() {
  try {
    const { error } = await (supabase.from("notifications" as any) as any)
      .update({ read: true })
      .eq("recipient_role", "admin")
      .eq("read", false);

    if (error) console.warn("Failed to mark all notifications as read:", error.message);
  } catch (err) {
    console.error("Error marking all notifications read:", err);
  }
}
