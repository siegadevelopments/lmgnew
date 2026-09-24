import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Deletes an order (and its order_items) as an authenticated admin, using the service-role
// key so the operation can't be silently no-op'd by a client-side RLS policy. The admin app's
// own Supabase client previously ran this delete directly from the browser; if the `orders`/
// `order_items` tables don't grant DELETE to the logged-in user's role, Postgres reports 0 rows
// affected rather than an error, so the UI showed "deleted" while the row stayed in the DB.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: "order_id is required" });

    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", order_id);
    if (itemsError) return res.status(500).json({ error: itemsError.message });

    const { data: deleted, error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order_id)
      .select();
    if (orderError) return res.status(500).json({ error: orderError.message });
    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: "Order not found (already deleted?)" });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
}
