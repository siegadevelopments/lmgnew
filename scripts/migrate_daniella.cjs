const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VENDOR_ID = "f575958c-804b-4a51-ba44-a923275fe53d"; // Daniella Hogarth

async function migrate() {
  const products = JSON.parse(fs.readFileSync('scripts/daniella_raw.json', 'utf8'));

  console.log(`Starting migration of ${products.length} products for Daniella Hogarth...`);

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
    return {
      vendor_id: VENDOR_ID,
      title: p.title,
      slug: p.slug + "-" + Math.floor(Math.random() * 1000), // Avoid collision
      excerpt: p.description.substring(0, 150) + '...',
      content: p.description,
      price: p.price,
      image_url: p.image_url || null,
      stock: 100,
      status: 'published',
      brand: 'Daniella Hogarth',
      category: 'Health & Wellness',
      tags: ['Natural', 'Healing', 'Wellness']
    };
  });

  const { data, error } = await supabase
    .from('products')
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Migration error:", error.message);
    console.error("Details:", error.details);
  } else {
    console.log(`Successfully migrated ${data.length} products for Daniella Hogarth.`);
  }
}

migrate();
