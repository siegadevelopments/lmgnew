import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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
  const vendorId = "db21b735-793e-46a6-8660-48099e913118";

  // 1. Ensure vendor is approved and live
  console.log("Setting vendor is_approved=true and is_live=true...");
  const { error: vendorError } = await supabase
    .from("vendor_profiles")
    .update({ is_approved: true, is_live: true })
    .eq("id", vendorId);

  if (vendorError) {
    console.error("Vendor update failed:", vendorError);
  } else {
    console.log("✓ Vendor live status updated successfully.");
  }

  // 2. Update category for all products of Kylie's Professional
  console.log("Updating product categories to 'Health & Beauty'...");
  const { data, error: prodError } = await supabase
    .from("products")
    .update({ category: "Health & Beauty" })
    .eq("vendor_id", vendorId)
    .select("id");

  if (prodError) {
    console.error("Product category update failed:", prodError);
  } else {
    console.log(`✓ Updated ${data ? data.length : 0} products to category 'Health & Beauty'.`);
  }
}

main().catch(console.error);
