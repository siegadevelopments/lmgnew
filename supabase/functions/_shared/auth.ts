// Shared authorization helpers for Edge Functions.
//
// Supabase's default `verify_jwt` only proves the caller holds *a* valid JWT — and the public
// anon key is one. Every function that does anything privileged must therefore authorize the
// caller itself using the helpers below.
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Role = "admin" | "vendor" | "authenticated" | "service";

const json = (body: unknown, status: number, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify({ error: body }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Constant-time string comparison (avoids leaking secret length/prefix via timing).
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/**
 * Returns `null` when the caller is allowed, otherwise a ready-to-return 401/403 Response.
 *   - "service"       : caller presents the service-role key (internal function-to-function calls)
 *   - "admin"/"vendor": signed-in user whose profiles.role matches
 *   - "authenticated" : any signed-in user
 */
export async function requireAuth(
  req: Request,
  allowed: Role[],
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return json("Unauthorized", 401, corsHeaders);

  // @ts-ignore
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (allowed.includes("service") && serviceKey && safeEqual(header.slice(7), serviceKey)) return null;

  const userClient = createClient(
    // @ts-ignore
    Deno.env.get("SUPABASE_URL") ?? "",
    // @ts-ignore
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: header } } },
  );
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json("Unauthorized", 401, corsHeaders);

  if (allowed.includes("authenticated")) return null;

  const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role && allowed.includes(profile.role as Role)) return null;

  return json("Forbidden", 403, corsHeaders);
}

/**
 * For webhooks (DB webhooks, inbound email) that cannot send a user JWT. The sender must supply
 * the shared secret in `x-webhook-secret` or `?token=`. Fails closed if the secret is not configured.
 */
export function requireWebhookSecret(
  req: Request,
  envName: string,
  corsHeaders: Record<string, string>,
): Response | null {
  // @ts-ignore
  const expected = Deno.env.get(envName) ?? "";
  if (!expected) return json(`${envName} is not configured`, 500, corsHeaders);
  const provided = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("token") ?? "";
  return safeEqual(provided, expected) ? null : json("Unauthorized", 401, corsHeaders);
}

export const escapeHtml = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
