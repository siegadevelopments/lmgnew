const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("ERROR: VITE_SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VENDOR_ID = "0c5a69d4-ecc9-4bc4-8c71-47f65bad7c21"; // Lhamour
const SHOP_URL = "https://www.lhamour.com/products.json?limit=250";

async function migrate() {
  console.log(`--- STARTING LHAMOUR MIGRATION ---`);
  
  try {
    console.log(`Fetching products from ${SHOP_URL}...`);
    const response = await fetch(SHOP_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const products = data.products;

    console.log(`Found ${products.length} products. Processing...`);

    // First, delete existing products for this vendor to avoid duplicates
    console.log("Cleaning up existing Lhamour products...");
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
      let excerpt = p.body_html
        .split(/<\/p>|<\/h2>|<\/h3>/)[0]
        .replace(/<[^>]*>/g, '')
        .trim();
      
      if (excerpt.length > 200) {
        excerpt = excerpt.substring(0, 197) + '...';
      } else if (excerpt.length === 0) {
        excerpt = p.title;
      }

      return {
        vendor_id: VENDOR_ID,
        title: p.title,
        slug: p.handle,
        excerpt: excerpt,
        content: p.body_html,
        price: parseFloat(baseVariant.price),
        image_url: p.images[0]?.src || null,
        stock: baseVariant.available ? 50 : 0,
        status: 'published',
        brand: 'Lhamour',
        category: p.product_type || 'Skincare',
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

    console.log(`Inserting ${toInsert.length} products into Supabase...`);
    const { data: insertedData, error } = await supabase
      .from('products')
      .insert(toInsert)
      .select();

    if (error) {
      console.error("Migration error:", error.message);
      console.error("Details:", error.details);
    } else {
      console.log(`Successfully migrated ${insertedData.length} products for Lhamour.`);
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  }
}

migrate();
