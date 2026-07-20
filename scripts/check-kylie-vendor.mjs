import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
const envFile = readFileSync(resolve("d:/projects/projects/lmgnew/.env.local"), "utf-8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[key] = val;
}

const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data: vendors, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .ilike("store_name", "%Kylie%Professional%");

  console.log("Kylie's Professional Vendor Profiles:", vendors);

  if (vendors && vendors.length > 0) {
    const vendor = vendors[0];
    if (!vendor.is_approved || !vendor.is_live) {
      console.log("Vendor is not approved or not live. Updating to true...");
      const { data: updated, error: updateError } = await supabase
        .from("vendor_profiles")
        .update({ is_approved: true, is_live: true })
        .eq("id", vendor.id)
        .select();
      console.log("Updated vendor:", updated, updateError);
    } else {
      console.log("Vendor is already approved and live.");
    }
  }
}

main().catch(console.error);
