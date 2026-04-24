const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
const WP_API_BASE = "https://lifestylemedicinegateway.com/wp-json";

if (!SUPABASE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EXCLUDED_VENDORS = ["E-training Group", "Ernest Joseph Siega"];

let VENDOR_MAP = {};
let BRANDS = {};
let TAGS = {};
let CATEGORIES = {};

async function fetchAll(url) {
  let allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pagedUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`;
    console.log(`Fetching: ${pagedUrl}`);
    try {
      const response = await fetch(pagedUrl);
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

async function resolveTaxonomies() {
  console.log("Resolving taxonomies (brands, tags, categories)...");
  
  const [brands, tags, cats] = await Promise.all([
    fetchAll(`${WP_API_BASE}/wp/v2/product_brand`),
    fetchAll(`${WP_API_BASE}/wp/v2/product_tag`),
    fetchAll(`${WP_API_BASE}/wp/v2/product_cat`)
  ]);

  brands.forEach(b => BRANDS[b.id] = b.name);
  tags.forEach(t => TAGS[t.id] = t.name);
  cats.forEach(c => CATEGORIES[c.id] = c.name);

  console.log(`Loaded ${Object.keys(BRANDS).length} brands, ${Object.keys(TAGS).length} tags, ${Object.keys(CATEGORIES).length} categories.`);
}

async function getOrCreateVendor(wpVendor) {
  const name = wpVendor.store_name || wpVendor.first_name + " " + wpVendor.last_name;
  if (EXCLUDED_VENDORS.includes(name.trim())) return null;

  const email = wpVendor.email || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@lifestylemedicinegateway.com`;

  // Check if vendor profile exists
  const { data: existing } = await supabase.from('vendor_profiles').select('id').eq('store_name', name).maybeSingle();
  
  if (existing) {
    VENDOR_MAP[wpVendor.id] = existing.id;
    return existing.id;
  }

  console.log(`Creating account for vendor: ${name} (${email})`);
  
  // Create Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: crypto.randomBytes(16).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const foundUser = users.users.find(u => u.email === email);
      if (foundUser) {
        userId = foundUser.id;
      } else {
        console.error(`Auth error for ${name}:`, authError.message);
        return null;
      }
    } else {
      console.error(`Failed to create auth user for ${name}:`, authError.message);
      return null;
    }
  } else {
    userId = authUser.user.id;
  }

  // Create Profiles
  await supabase.from('profiles').upsert({ id: userId, full_name: name, role: 'vendor' });
  await supabase.from('vendor_profiles').upsert({ 
    id: userId, 
    store_name: name,
    store_description: wpVendor.store_description || "",
    store_logo_url: wpVendor.gravatar || "",
    is_approved: true 
  });

  VENDOR_MAP[wpVendor.id] = userId;
  return userId;
}

async function runMigration() {
  await resolveTaxonomies();

  console.log("Fetching vendors...");
  const vendors = await fetchAll(`${WP_API_BASE}/dokan/v1/stores`);
  console.log(`Found ${vendors.length} vendors.`);

  const allProducts = [];

  for (const v of vendors) {
    const supabaseVendorId = await getOrCreateVendor(v);
    if (!supabaseVendorId) continue;

    console.log(`Fetching products for vendor: ${v.store_name} (ID: ${v.id})`);
    const products = await fetchAll(`${WP_API_BASE}/dokan/v1/stores/${v.id}/products`);
    
    for (const p of products) {
      allProducts.push({
        title: p.name,
        price: parseFloat(p.price) || 0,
        image_url: p.images && p.images.length > 0 ? p.images[0].src : "",
        content: p.description || p.short_description || "",
        slug: p.slug,
        vendor_id: supabaseVendorId,
        status: "published",
        brand: p.brands && p.brands.length > 0 ? p.brands[0].name : (p.product_brand && p.product_brand.length > 0 ? BRANDS[p.product_brand[0]] : null),
        tags: (p.tags || []).map(t => t.name).concat((p.product_tag || []).map(tid => TAGS[tid])).filter(Boolean),
        category: p.categories && p.categories.length > 0 ? p.categories[0].name : (p.product_cat && p.product_cat.length > 0 ? CATEGORIES[p.product_cat[0]] : "Uncategorized"),
        stock: 50
      });
    }
  }

  console.log(`Prepared ${allProducts.length} products for migration.`);

  // Chunk insertion to avoid payload size limits
  const CHUNK_SIZE = 50;
  for (let i = 0; i < allProducts.length; i += CHUNK_SIZE) {
    const chunk = allProducts.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'slug' });
    if (error) {
      console.error(`Error inserting chunk ${i/CHUNK_SIZE + 1}:`, error.message);
    } else {
      console.log(`Inserted chunk ${i/CHUNK_SIZE + 1} of ${Math.ceil(allProducts.length/CHUNK_SIZE)}`);
    }
  }

  console.log("Migration finished!");
}

runMigration();
