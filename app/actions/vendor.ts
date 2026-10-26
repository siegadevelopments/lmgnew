"use server";

import { createClient } from "@supabase/supabase-js";

// Server actions can be called by anyone who knows the action ID, not just the admin page.
// This one writes with the service role (bypassing RLS), so it must check the caller itself:
// a valid Supabase session whose profile role is "admin". Only the fields the admin vendor
// dialog edits can be written.
const EDITABLE_FIELDS = [
  "store_name",
  "representative_name",
  "store_description",
  "store_logo_url",
  "store_banner_url",
  "website",
  "instagram",
  "facebook",
  "twitter",
  "ai_enabled",
  "ai_instructions",
  "vendor_type",
  "is_approved",
  "is_live",
  "commission_rate",
] as const;

export async function adminUpdateVendorProfile(
  accessToken: string,
  vendorId: string,
  updateData: Record<string, unknown>,
) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !publicKey || !serviceRoleKey) {
    throw new Error("Server configuration error: Missing Supabase credentials.");
  }
  if (!accessToken || typeof vendorId !== "string" || !vendorId) {
    throw new Error("Unauthorized");
  }

  const userClient = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Admin access required");

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (updateData && field in updateData) update[field] = updateData[field];
  }

  const { error } = await supabase.from("vendor_profiles").update(update).eq("id", vendorId);

  if (error) {
    console.error("Server Action Update Error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}
