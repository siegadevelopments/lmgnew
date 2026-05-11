const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: product, error } = await supabase
    .from('products')
    .select('id, slug')
    .ilike('slug', '%himalayan-salt-fine%');
  
  if (error) {
    console.error('Error:', error);
  } else {
    product.forEach(p => {
      console.log(`Slug: "${p.slug}"`);
      console.log(`Hex:  ${Buffer.from(p.slug).toString('hex')}`);
    });
  }
}
check();
