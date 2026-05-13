const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLegacyUrls() {
  const tables = ['articles', 'products', 'natural_remedies', 'recipes'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id, image_url')
      .or('image_url.ilike.%wordpress%,image_url.ilike.%wix%');
    
    if (error) {
      console.error(`Error checking ${table}:`, error);
      continue;
    }
    
    console.log(`${table}: Found ${data.length} legacy URLs`);
    if (data.length > 0) {
      data.forEach(item => console.log(`  - ${item.image_url}`));
    }
  }
}

checkLegacyUrls();
