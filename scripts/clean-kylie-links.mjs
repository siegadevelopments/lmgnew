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
  // Find Kylie's Professional vendor id
  const { data: vendors } = await supabase
    .from("vendor_profiles")
    .select("id")
    .ilike("store_name", "%Kylie%Professional%");

  if (!vendors || vendors.length === 0) {
    console.error("Vendor not found");
    return;
  }
  
  const vendorId = vendors[0].id;
  console.log(`Found vendor ID: ${vendorId}`);

  // Fetch all products for this vendor
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, title, content")
    .eq("vendor_id", vendorId);

  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  console.log(`Fetched ${products.length} products to clean up.`);
  let updatedCount = 0;

  for (const product of products) {
    if (product.content && product.content.includes("View on Kylie's Professional website")) {
      // Remove the link paragraph line
      // Format 1: \n<p style="margin-top: 16px;"><a href="..." target="_blank" rel="noopener noreferrer">View on Kylie's Professional website →</a></p>
      // Using regex to remove this line clean and safe
      const cleanContent = product.content.replace(/\n*<p[^>]*><a[^>]*href="[^"]*kylies\.com\.au[^"]*"[^>]*>View on Kylie's Professional website[^<]*<\/a><\/p>/gi, "").trim();

      const { error: updateError } = await supabase
        .from("products")
        .update({ content: cleanContent })
        .eq("id", product.id);

      if (updateError) {
        console.error(`Failed to update ${product.title}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully cleaned up descriptions for ${updatedCount} products.`);
}

main().catch(console.error);
