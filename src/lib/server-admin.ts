import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client for SERVER code that must act without a user session (cron jobs,
// verified review submission by token). Bypasses RLS: never import it from a client component,
// and always check the caller (CRON_SECRET, review token) before using it.

let cached: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("getAdminSupabase() is server-only");
  if (cached) return cached;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url.startsWith("http") || !key || key === "[SENSITIVE]") {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  }
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/** The order behind a review link, or null if the link is unknown, expired or the order refunded. */
export async function findOrderByReviewToken(token: string) {
  const { isValidTokenShape, reviewLinkExpired } = await import("@/lib/reviews");
  if (!isValidTokenShape(token)) return null;
  const { data, error } = await getAdminSupabase()
    .from("orders")
    .select("id, user_id, first_name, last_name, payment_status, status, review_requested_at")
    .eq("review_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.payment_status !== "paid" || data.status === "cancelled") return null;
  if (reviewLinkExpired(data.review_requested_at)) return null;
  return data;
}
