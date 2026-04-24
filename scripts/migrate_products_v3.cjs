const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const WP_API_BASE = "https://lifestylemedicinegateway.com/wp-json";
const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function decodeHtml(html) {
  if (!html) return "";
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&');
}

async function fetchAll(url) {
  let allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pagedUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`;
    console.log(`Fetching: ${pagedUrl}`);
    try {
      const response = await fetch(pagedUrl);
      if (!response.ok) {
        hasMore = false;
        break;
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        allData = allData.concat(data);
        page++;
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
      hasMore = false;
    }
  }
  return allData;
}

async function getOrCreateVendor(store) {
  const name = store.store_name || store.name;
  if (!name || name === "E-training Group" || name === "Ernest Joseph Siega") return null;

  const email = (store.show_email && store.email) ? store.email : `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@lifestylemedicinegateway.com`;

  // Try to find existing profile
  const { data: existing } = await supabase.from('vendor_profiles').select('id').eq('store_name', name).maybeSingle();
  if (existing) return existing.id;

  console.log(`Provisioning vendor: ${name}...`);
  
  // Create Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomBytes(16).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const foundUser = users.users.find(u => u.email === email);
      if (foundUser) userId = foundUser.id;
    }
    if (!userId) {
      console.error(`Failed to create/find user for ${name}:`, authError.message);
      return null;
    }
  } else {
    userId = authUser.user.id;
  }

  // Create Profile
  await supabase.from('profiles').upsert({ id: userId, full_name: name, role: 'vendor' });

  // Create Vendor Profile
  const { error: vError } = await supabase.from('vendor_profiles').upsert({
    id: userId,
    store_name: name,
    store_description: decodeHtml(store.description || ""),
    store_logo_url: store.avatar || store.gravatar || "",
    is_approved: true
  });

  if (vError) {
    console.error(`Failed to create vendor profile for ${name}:`, vError.message);
    return null;
  }

  return userId;
}

async function migrate() {
  console.log("--- STARTING COMPREHENSIVE MIGRATION V3 ---");

  // 1. Resolve Brands from WP REST API (because Dokan Store API misses them)
  console.log("Fetching brands and product brand mapping...");
  const [wpBrands, wpProducts] = await Promise.all([
    fetchAll(`${WP_API_BASE}/wp/v2/product_brand`),
    fetchAll(`${WP_API_BASE}/wp/v2/product`)
  ]);

  const brandIdToName = Object.fromEntries(wpBrands.map(b => [b.id, decodeHtml(b.name)]));
  const productIdToBrandName = new Map();
  for (const p of wpProducts) {
    if (p.product_brand && p.product_brand.length > 0) {
      productIdToBrandName.set(p.id, brandIdToName[p.product_brand[0]]);
    }
  }

  // 2. Fetch Vendors and their Products from Dokan API
  console.log("Fetching vendors and store products...");
  const vendors = await fetchAll(`${WP_API_BASE}/dokan/v1/stores`);
  const allProductsToInsert = [];

  for (const v of vendors) {
    const supabaseVendorId = await getOrCreateVendor(v);
    if (!supabaseVendorId) continue;

    console.log(`Fetching products for vendor: ${v.store_name} (ID: ${v.id})`);
    const storeProducts = await fetchAll(`${WP_API_BASE}/dokan/v1/stores/${v.id}/products`);
    
    for (const p of storeProducts) {
      // Decode and sanitize
      const title = decodeHtml(p.name);
      const content = decodeHtml(p.description);
      const excerpt = decodeHtml(p.short_description);
      
      // Resolve brand from our map
      const brand = productIdToBrandName.get(p.id) || null;
      
      // Resolve categories and tags (Dokan API returns objects)
      const categories = (p.categories || []).map(c => decodeHtml(c.name));
      const tags = (p.tags || []).map(t => decodeHtml(t.name));

      allProductsToInsert.push({
        title,
        slug: p.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content,
        excerpt,
        price: parseFloat(p.price) || 0,
        image_url: p.images && p.images.length > 0 ? p.images[0].src : "",
        status: "published",
        vendor_id: supabaseVendorId,
        brand: brand,
        category: categories[0] || null,
        tags: tags,
        stock: 50
      });
    }
  }

  console.log(`Total products to migrate: ${allProductsToInsert.length}`);

  // 3. Clean up existing products (Optional but recommended for consistency)
  console.log("Cleaning up existing products in Supabase...");
  // We'll delete products that are not part of our new set OR just clear the table
  // To be safe and clean, let's delete all products where vendor_id is null or from e-training
  const { error: cleanupError } = await supabase.from('products').delete().or('vendor_id.is.null');
  if (cleanupError) console.error("Cleanup error:", cleanupError.message);

  const CHUNK_SIZE = 50;
  for (let i = 0; i < allProductsToInsert.length; i += CHUNK_SIZE) {
    const chunk = allProductsToInsert.slice(i, i + CHUNK_SIZE);
    console.log(`Upserting chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(allProductsToInsert.length / CHUNK_SIZE)}...`);
    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'slug' });
    if (error) {
      console.error(`Error upserting chunk:`, error.message);
    }
  }

  console.log("Migration V3 completed successfully!");
}

migrate().catch(console.error);
