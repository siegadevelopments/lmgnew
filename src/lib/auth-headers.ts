import { supabase } from "@/integrations/supabase/client";

/** Authorization header for calling our own protected API routes (empty when signed out). */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}
