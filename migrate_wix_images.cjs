const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Starting Wix image migration...");

  // 1. Fetch products with Wix URLs
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, image_url')
    .ilike('image_url', '%wixstatic%');

  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  console.log(`Found ${products.length} products with Wix images.`);

  for (const product of products) {
    console.log(`\nProcessing: ${product.title}`);
    try {
      const wixUrl = product.image_url;
      const fileName = `migration/${path.basename(wixUrl.split('?')[0])}`;
      
      // 2. Download the image
      const response = await fetch(wixUrl);
      if (!response.ok) throw new Error(`Failed to download Wix image: ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // 3. Get R2 upload URL
      console.log(`  Getting R2 upload URL for: ${fileName}`);
      const { data: r2Data, error: r2Error } = await supabase.functions.invoke('get-r2-upload-url', {
        body: { fileName, contentType }
      });

      if (r2Error || !r2Data?.uploadUrl) {
        throw new Error(`R2 Function Error: ${r2Error?.message || 'No upload URL'}`);
      }

      // 4. Upload to R2
      console.log(`  Uploading to R2...`);
      const uploadRes = await fetch(r2Data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: buffer
      });

      if (!uploadRes.ok) throw new Error(`R2 PUT failed: ${uploadRes.status}`);

      // 5. Update Database
      const newUrl = r2Data.publicUrl;
      console.log(`  Updating database with new URL: ${newUrl}`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: newUrl })
        .eq('id', product.id);

      if (updateError) throw updateError;
      
      console.log(`  SUCCESS: ${product.title} migrated.`);
    } catch (err) {
      console.error(`  FAILED: ${product.title}:`, err.message);
    }
  }

  console.log("\nMigration complete!");
}

migrate();
