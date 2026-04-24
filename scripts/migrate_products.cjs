const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
// NOTE: Must use Service Role Key to bypass RLS and use Auth Admin API
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

let VENDOR_MAP = {};

async function getOrCreateVendors() {
  console.log("Ensuring vendors exist...");
  
  const vendorDataPath = path.join(__dirname, 'scraped_vendors.json');
  if (!fs.existsSync(vendorDataPath)) {
    console.error("Vendor data file not found!");
    return;
  }
  
  const vendors = JSON.parse(fs.readFileSync(vendorDataPath, 'utf8'));

  for (const v of vendors) {
    const name = v.storeName;
    const email = v.storeEmail || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@lifestylemedicinegateway.com`;

    // 1. Check if vendor profile exists
    const { data: existing } = await supabase.from('vendor_profiles').select('id').eq('store_name', name).maybeSingle();
    
    if (existing) {
      VENDOR_MAP[name] = existing.id;
      console.log(`Vendor "${name}" found with ID ${existing.id}`);
    } else {
      console.log(`Creating new vendor account for "${name}" (${email})...`);
      
      // 2. Create Auth User
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: crypto.randomBytes(16).toString('hex'), // Random password
        email_confirm: true,
        user_metadata: { full_name: name }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
            // If user exists but profile missing, try to find the user
            const { data: users } = await supabase.auth.admin.listUsers();
            const foundUser = users.users.find(u => u.email === email);
            if (foundUser) {
                console.log(`Auth user already exists for ${name}. Linking...`);
                await createProfiles(foundUser.id, v);
                continue;
            }
        }
        console.error(`Failed to create auth user for ${name}:`, authError.message);
        continue;
      }

      await createProfiles(authUser.user.id, v);
    }
  }
}

async function createProfiles(id, v) {
    const name = v.storeName;
    // 3. Create Profile (should happen automatically via trigger if set up, but let's be explicit)
    const { error: pError } = await supabase.from('profiles').upsert({ 
        id, 
        full_name: name, 
        role: 'vendor' 
    });
    
    if (pError) {
        console.error(`Failed to create profile for ${name}:`, pError.message);
        return;
    }
    
    // 4. Create Vendor Profile
    const { error: vError } = await supabase.from('vendor_profiles').upsert({ 
        id, 
        store_name: name,
        store_description: v.storeDescription,
        store_logo_url: v.storeLogoUrl,
        is_approved: true 
    });
    
    if (vError) {
        console.error(`Failed to create vendor profile for ${name}:`, vError.message);
        return;
    }
    
    VENDOR_MAP[name] = id;
    console.log(`Vendor "${name}" created and linked successfully.`);
}

async function migrateProducts() {
  console.log("Starting product migration...");
  await getOrCreateVendors();

  // Load scraped data
  const dataPath = path.join(__dirname, 'scraped_products.json');
  if (!fs.existsSync(dataPath)) {
    console.error("Scraped product data file not found!");
    return;
  }
  
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${products.length} products.`);

  const toInsert = products
    .filter(p => p.vendor !== "E-training Group") // Exclude dummy products
    .map(p => {
        const vendorId = VENDOR_MAP[p.vendor] || VENDOR_MAP["Go Organic Shopping Australia"];
        if (!vendorId) {
            console.warn(`Warning: No vendor ID found for "${p.vendor}". Skipping product "${p.title}".`);
            return null;
        }
        return {
            title: p.title,
            price: parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0,
            image_url: p.image_url,
            content: p.description,
            slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            vendor_id: vendorId,
            status: "published",
            brand: p.brand || null,
            tags: p.tags || [],
            stock: 50
        };
    }).filter(Boolean);

  console.log(`Preparing to insert ${toInsert.length} products.`);

  const { error } = await supabase.from('products').upsert(toInsert, { onConflict: 'slug' });

  if (error) {
    console.error("Product insertion failed:", error.message);
  } else {
    console.log("Product migration completed successfully!");
  }
}

migrateProducts();
