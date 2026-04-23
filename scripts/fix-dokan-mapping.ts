import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_DOKAN_API = "https://lifestylemedicinegateway.com/wp-json/dokan/v1";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching Supabase users to build Dokan Store ID mapping...");
  const { data: existingUsers, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;

  const vendorMap: Record<number, string> = {};
  for (const u of existingUsers.users) {
    if (u.email && u.email.startsWith("vendor_")) {
      // Extract WP user ID from vendor_123@lmgateway.test
      const match = u.email.match(/vendor_(\d+)@/);
      if (match && match[1]) {
        vendorMap[parseInt(match[1], 10)] = u.id;
      }
    }
  }
  console.log(`Loaded ${Object.keys(vendorMap).length} mapped vendors from Supabase.`);

  console.log("Fetching Dokan Stores...");
  const res = await fetch(`${WP_DOKAN_API}/stores?per_page=100`);
  const stores = await res.json();
  console.log(`Found ${stores.length} Dokan stores.`);

  let matchCount = 0;

  for (const store of stores) {
    const sbVendorId = vendorMap[store.id];
    if (!sbVendorId) {
      console.log(`No Supabase mapping found for Dokan store ${store.id} (${store.store_name})`);
      continue;
    }

    let p = 1, tP = 1;
    do {
      const url = `${WP_DOKAN_API}/stores/${store.id}/products?per_page=100&page=${p}`;
      const pRes = await fetch(url);
      tP = parseInt(pRes.headers.get('x-wp-totalpages') || '1', 10);
      const prods = await pRes.json();
      
      if (prods && Array.isArray(prods) && prods.length > 0) {
        // Prepare batch update or individual updates
        // To update multiple products to this vendor_id:
        const productIds = prods.map((pr: any) => pr.id);
        const { error } = await supabase
          .from("products")
          .update({ vendor_id: sbVendorId })
          .in("id", productIds);
          
        if (error) {
          console.error(`Error updating products for store ${store.store_name}:`, error.message);
        } else {
          matchCount += productIds.length;
        }
      }
      p++;
    } while (p <= tP);
  }

  console.log(`Successfully mapped ${matchCount} products to their Dokan vendors in Supabase!`);
}

run().catch(console.error);
