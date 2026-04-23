import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_API_URL = "https://lifestylemedicinegateway.com/wp-json/wp/v2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching WP users (vendors)...");
  const userRes = await fetch(`${WP_API_URL}/users?per_page=100`);
  const wpUsers = await userRes.json();
  console.log(`Found ${wpUsers.length} users.`);

  const vendorMap: Record<number, string> = {};

  for (const wpUser of wpUsers) {
    const email = `vendor_${wpUser.id}@lmgateway.test`;
    console.log(`Migrating vendor: ${wpUser.name} (${email})`);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        full_name: wpUser.name,
        role: "vendor",
      }
    });

    if (authError) {
      if (authError.message.includes("already exist") || authError.message.includes("already been registered")) {
        // Find them
        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing.users.find(u => u.email === email);
        if (found) {
          vendorMap[wpUser.id] = found.id;
        }
      } else {
        console.error("Auth error:", authError.message);
        continue;
      }
    }

    const sbUserId = authData?.user?.id;
    if (!sbUserId) continue;

    vendorMap[wpUser.id] = sbUserId;

    // Update profile role (trigger creates the profile but we enforce role)
    await supabase.from("profiles").update({ role: "vendor", full_name: wpUser.name }).eq("id", sbUserId);

    // Create vendor profile
    await supabase.from("vendor_profiles").upsert({
      id: sbUserId,
      store_name: wpUser.name,
      store_description: wpUser.description || null,
      store_logo_url: wpUser.avatar_urls?.["96"] || null,
      is_approved: true,
    });
  }

  console.log("Vendors migrated. Mapping products to vendors...");

  // Fetch WP products to get the 'author' field
  console.log("Fetching products...");
  const prodRes = await fetch(`${WP_API_URL}/product?per_page=100`);
  const wpProducts = await prodRes.json();

  let mappingsCount = 0;
  for (let i = 0; i < wpProducts.length; i++) {
    const prod = wpProducts[i];
    let wpVendorId = null;
    if (prod.store && prod.store.id) wpVendorId = prod.store.id;
    else if (prod.store && prod.store.vendor_id) wpVendorId = prod.store.vendor_id;
    else if (prod.post_author) wpVendorId = prod.post_author;
    else if (prod.author) wpVendorId = prod.author;

    if (i < 3) console.log("Product", prod.id, "post_author is:", `"${prod.post_author}"`, "typeof:", typeof prod.post_author);

    if (wpVendorId) {
      // Cast to number just in case post_author is a string "661"
      const authorIdNum = Number(wpVendorId);
      const sbVendorId = vendorMap[authorIdNum];
      if (sbVendorId) {
        await supabase.from("products").update({ vendor_id: sbVendorId }).eq("id", prod.id);
        mappingsCount++;
      }
    }
  }

  console.log(`Successfully mapped ${mappingsCount} products to vendors!`);
  console.log("Vendor Migration Complete 🎉");
}

run().catch(console.error);
