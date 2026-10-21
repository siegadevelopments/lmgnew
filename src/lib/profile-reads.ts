import { supabase } from "@/integrations/supabase/client";

// Signed-in users can't read profiles.phone directly (see
// supabase/migrations/20261021_hide_phone_from_signed_in_users.sql): Postgres column permissions
// can't be limited to "your own row". Reads that need phone or the full row go through these
// SECURITY DEFINER functions instead (supabase/migrations/20261021_profile_read_functions.sql).

/** The signed-in user's own profile, phone included. null when not signed in or no profile. */
export async function fetchMyProfile(): Promise<Record<string, any> | null> {
  const { data, error } = await (supabase as any).rpc("get_my_profile").maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Every profile (admins only; non-admins get an empty list). Chain .limit() etc. as needed. */
export function adminListProfiles() {
  return (supabase as any).rpc("admin_list_profiles").order("created_at", { ascending: false });
}
