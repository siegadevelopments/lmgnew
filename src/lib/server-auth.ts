import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Authorization guard for Next.js route handlers (app/api/**).
 * Returns `null` when the caller is allowed, otherwise a 401/403 NextResponse to return as-is.
 *
 *   const denied = await requireUser(req, "admin");
 *   if (denied) return denied;
 */
export async function requireUser(req: Request, role: "admin" | "authenticated"): Promise<NextResponse | null> {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    { global: { headers: { Authorization: header } } },
  );
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role === "authenticated") return null;

  const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
