const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VENDOR_ID = "a1dfc727-c3c7-40b9-916f-32ded47e20dc"; // A Better

async function migrate() {
  const raw = JSON.parse(fs.readFileSync('scripts/abetter_raw.json', 'utf8'));
  const products = raw.products;

  console.log(`Starting migration of ${products.length} products...`);

  // First, delete existing products for this vendor to avoid duplicates
  const { error: delError } = await supabase
    .from('products')
    .delete()
    .eq('vendor_id', VENDOR_ID);
  
  if (delError) {
    console.error("Error deleting old products:", delError.message);
    return;
  }

  const toInsert = products.map(p => {
    const baseVariant = p.variants[0];
    
    // Extract first paragraph for excerpt
    const excerpt = p.body_html.split(/<\/p>|<\/h2>/)[0].replace(/<[^>]*>/g, '').substring(0, 200) + '...';

    return {
      vendor_id: VENDOR_ID,
      title: p.title,
      slug: p.handle,
      excerpt: excerpt,
      content: p.body_html,
      price: parseFloat(baseVariant.price),
      image_url: p.images[0]?.src || null,
      stock: baseVariant.available ? 100 : 0,
      status: 'published',
      brand: 'A Better',
      category: p.product_type || 'Wellness',
      tags: p.tags,
      variants: p.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        available: v.available,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3
      })),
      images: p.images.map(img => img.src)
    };
  });

  const { data, error } = await supabase
    .from('products')
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Migration error:", error.message);
    console.error("Details:", error.details);
    if (error.message.includes('column "variants" of relation "products" does not exist')) {
      console.log("\n>>> ACTION REQUIRED: You must run supabase/add_variants_to_products.sql first!");
    }
  } else {
    console.log(`Successfully migrated ${data.length} products for A Better.`);
  }
}

migrate();
