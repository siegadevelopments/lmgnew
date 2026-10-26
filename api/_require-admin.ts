import type { VercelRequest } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Shared admin check for Vercel api/*.ts routes: a valid Supabase session whose profile role is
// "admin". Returns null when allowed, otherwise { status, error } to send back.
// Env names fall back in order because Vercel has had both NEXT_PUBLIC_ and older VITE_ names.
export async function requireAdmin(req: VercelRequest): Promise<{ status: number; error: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return { status: 401, error: "Unauthorized" };

  const url = [process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.VITE_SUPABASE_URL].find(
    (u) => !!u && u.startsWith("http"),
  );
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !serviceKey) return { status: 500, error: "Server auth is not configured" };

  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return { status: 401, error: "Invalid session" };

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? null : { status: 403, error: "Admin access required" };
}
