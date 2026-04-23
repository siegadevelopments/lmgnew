import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_API_URL = "https://lifestylemedicinegateway.com/wp-json/wp/v2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const getPrice = (product: any): number => {
  if (product._updated_price) return parseFloat(product._updated_price);
  if (product.price) return parseFloat(product.price);
  return Math.round((Math.random() * 80 + 10) * 100) / 100; // Mock price if missing
};

const getImageUrl = (post: any): string | null => {
  if (post.featured_image_url) {
    const urls = Object.values(post.featured_image_url);
    if (urls.length > 0) return urls[0] as string;
  }
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url) return media.source_url;
  return null;
};

async function run() {
  console.log("Fetching WP users to build vendor map...");
  const userRes = await fetch(`${WP_API_URL}/users?per_page=100`);
  const wpUsers = await userRes.json();
  
  const vendorMap: Record<number, string> = {};
  
  const { data: existingUsers, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  
  for (const wpUser of wpUsers) {
    const email = `vendor_${wpUser.id}@lmgateway.test`;
    const found = existingUsers.users.find((u: any) => u.email === email);
    if (found) {
      vendorMap[wpUser.id] = found.id;
    }
  }
  console.log(`Built vendor map with ${Object.keys(vendorMap).length} entries.`);

  console.log("Fetching categories...");
  const prodCatRes = await fetch(`${WP_API_URL}/product_cat?per_page=100`);
  const wpProdCategories = await prodCatRes.json();
  
  const { data: dbCategories } = await supabase.from("categories").select("*").eq("type", "product");

  console.log("Fetching all products...");
  
  let page = 1;
  let totalPages = 1;
  let allProducts: any[] = [];
  
  do {
    console.log(`Fetching products page ${page}...`);
    const res = await fetch(`${WP_API_URL}/product?per_page=100&page=${page}&_embed=1`);
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
  
  let successCount = 0;
  
  const batchSize = 50;
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    
    const productsToInsert = batch.map((prod: any) => {
      let wpVendorId = null;
      if (prod.store && prod.store.id) wpVendorId = prod.store.id;
      else if (prod.store && prod.store.vendor_id) wpVendorId = prod.store.vendor_id;
      else if (prod.post_author) wpVendorId = prod.post_author;
      else if (prod.author) wpVendorId = prod.author;

      let sbVendorId = null;
      if (wpVendorId) {
        sbVendorId = vendorMap[Number(wpVendorId)] || null;
      }
      
      return {
        id: prod.id,
        title: prod.title.rendered,
        slug: prod.slug,
        excerpt: prod.excerpt?.rendered || null,
        content: prod.content?.rendered || null,
        price: getPrice(prod),
        image_url: getImageUrl(prod),
        stock: 50,
        status: "published",
        vendor_id: sbVendorId
      };
    });
    
    console.log(`Inserting batch of ${productsToInsert.length} products...`);
    const { error } = await supabase.from("products").upsert(productsToInsert);
    if (error) {
      console.error("Error bulk inserting products:", error.message);
    } else {
      successCount += productsToInsert.length;
    }
    
    const prodCatsToInsert: any[] = [];
    for (const prod of batch) {
      if (prod.product_cat && Array.isArray(prod.product_cat)) {
        for (const catId of prod.product_cat) {
          const wpCat = wpProdCategories.find((c: any) => c.id === catId);
          if (wpCat && dbCategories) {
            const dbCat = dbCategories.find(c => c.slug === wpCat.slug);
            if (dbCat) {
              prodCatsToInsert.push({ product_id: prod.id, category_id: dbCat.id });
            }
          }
        }
      }
    }
    
    if (prodCatsToInsert.length > 0) {
      await supabase.from("product_categories").upsert(prodCatsToInsert, { onConflict: "product_id,category_id" });
    }
  }

  console.log(`Finished migrating ${successCount} products mapped to vendors!`);
}

run().catch(console.error);
