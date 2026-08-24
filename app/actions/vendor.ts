"use server";

import { createClient } from "@supabase/supabase-js";

export async function adminUpdateVendorProfile(vendorId: string, updateData: any) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server configuration error: Missing Supabase credentials.");
  }

  // Use the service role key to completely bypass Row Level Security
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase
    .from("vendor_profiles")
    .update(updateData)
    .eq("id", vendorId);

  if (error) {
    console.error("Server Action Update Error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}
