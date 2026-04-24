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
    const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      vendor_id: VENDOR_ID,
      title: p.title,
      slug: slug + "-" + Math.floor(Math.random() * 1000), // Avoid collision
      excerpt: p.description.substring(0, 150) + '...',
      content: p.description,
      price: p.price,
      image_url: p.image_url || null,
      images: p.image_url ? [p.image_url] : [],
      stock: 100,
      status: 'published',
      brand: 'Daniella Hogarth',
      category: 'Health & Wellness',
      tags: ['Natural', 'Healing', 'Wellness'],
      variants: [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: "Default",
          price: p.price,
          sku: slug.substring(0, 20).toUpperCase(),
          available: true
        }
      ]
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
    
    // Update vendor categories
    console.log("Updating vendor categories...");
    const { error: vError } = await supabase
      .from('vendor_profiles')
      .update({ 
        store_categories: ['Health & Wellness', 'Natural Remedies', 'Detox', 'Aura Sprays'],
        is_live: true 
      })
      .eq('id', VENDOR_ID);
    
    if (vError) {
      console.error("Error updating vendor profile:", vError.message);
    } else {
      console.log("Vendor profile updated successfully.");
    }
  }
}

migrate();
