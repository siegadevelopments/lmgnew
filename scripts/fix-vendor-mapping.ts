import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_API_URL = "https://lifestylemedicinegateway.com/wp-json/wp/v2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching vendor profiles...");
  const { data: vendors, error: vError } = await supabase.from("vendor_profiles").select("id, store_name");
  if (vError) throw vError;
  
  const vendorMap: Record<string, string> = {};
  for (const v of vendors) {
    vendorMap[v.store_name] = v.id;
  }
  console.log(`Loaded ${vendors.length} vendors.`);

  console.log("Fetching all products from WP...");
  let page = 1;
  let totalPages = 1;
  let allProducts: any[] = [];
  
  do {
    const res = await fetch(`${WP_API_URL}/product?per_page=100&page=${page}`);
    if (page === 1) {
      totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1", 10);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      allProducts = allProducts.concat(data);
    }
    page++;
  } while (page <= totalPages);
  
  console.log(`Total products fetched: ${allProducts.length}`);
  
  let matchCount = 0;
  for (const prod of allProducts) {
    const vendorName = prod.uagb_author_info?.display_name;
    if (vendorName && vendorMap[vendorName]) {
      const vendorId = vendorMap[vendorName];
      const { error } = await supabase.from("products").update({ vendor_id: vendorId }).eq("id", prod.id);
      if (error) {
        console.error("Error updating product:", error.message);
      } else {
        matchCount++;
      }
    }
  }

  console.log(`Finished mapping ${matchCount} products to vendors!`);
}

run().catch(console.error);
