import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_API_URL = "https://lifestylemedicinegateway.com/wp-json";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching Dokan stores...");
  const storeRes = await fetch(`${WP_API_URL}/dokan/v1/stores?per_page=100`);
  const stores = await storeRes.json();
  console.log(`Found ${stores.length} stores.`);

  const vendorNameToId: Record<string, string> = {};

  for (const store of stores) {
    const email = `vendor_${store.id}@lmgateway.test`;
    
    // Find the user ID based on email created earlier
    const { data: existing } = await supabase.auth.admin.listUsers();
    const sbUser = existing.users.find(u => u.email === email);
    
    if (sbUser) {
      const storeName = store.store_name || `${store.first_name} ${store.last_name}`.trim();
      console.log(`Updating vendor profile for ${storeName}...`);
      
      await supabase.from("vendor_profiles").update({
        store_name: storeName,
        store_description: store.description || null,
        store_logo_url: store.gravatar || null,
        store_banner_url: store.banner || null
      }).eq("id", sbUser.id);
      
      vendorNameToId[`${store.first_name} ${store.last_name}`.trim().toLowerCase()] = sbUser.id;
      vendorNameToId[storeName.toLowerCase()] = sbUser.id;
    }
  }

  console.log("Fetching WP products for mapping...");
  const prodRes = await fetch(`${WP_API_URL}/wp/v2/product?per_page=100`);
  const wpProducts = await prodRes.json();

  let mappingsCount = 0;
  for (const prod of wpProducts) {
    let vendorId = null;
    
    if (prod.uagb_author_info && prod.uagb_author_info.display_name) {
      const authorName = prod.uagb_author_info.display_name.toLowerCase();
      vendorId = vendorNameToId[authorName];
    }
    
    if (!vendorId) {
      // try to match using the WP author id if we fetched the users.
      const wpUserRes = await fetch(`${WP_API_URL}/wp/v2/users/${prod.author}`).catch(()=>null);
      if (wpUserRes && wpUserRes.ok) {
         const wpUser = await wpUserRes.json();
         const email = `vendor_${wpUser.id}@lmgateway.test`;
         const { data: existing } = await supabase.auth.admin.listUsers();
         const sbUser = existing.users.find(u => u.email === email);
         if (sbUser) vendorId = sbUser.id;
      }
    }

    if (vendorId) {
      await supabase.from("products").update({ vendor_id: vendorId }).eq("id", prod.id);
      mappingsCount++;
    }
  }

  console.log(`Successfully mapped ${mappingsCount} products to vendors!`);
  console.log("Store Names updated and mapping complete!");
}

run().catch(console.error);
