const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const slugs = [
    'superbinder-heavy-metal-detox-262',
    'room-spray-blue-gum-250ml',
    'himalayan-salt-fine',
    'facci-palette-system-free-contour-brush'
  ];

  console.log("Checking specific products...");
  for (const slug of slugs) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        title, 
        slug, 
        status, 
        vendor_profiles(store_name, is_approved, is_live)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`Error for ${slug}:`, error);
    } else if (!data) {
      console.log(`[MISSING] Slug: ${slug}`);
    } else {
      const v = data.vendor_profiles;
      if (!v) {
        console.log(`[NO VENDOR] ${data.title} | Slug: ${slug}`);
        continue;
      }
      const visible = data.status === 'published' && v.is_approved && v.is_live;
      console.log(`[${visible ? 'VISIBLE' : 'HIDDEN '}] ${data.title.padEnd(40)} | Status: ${data.status.padEnd(10)} | Vendor: ${v.store_name.padEnd(20)} | Approved: ${v.is_approved} | Live: ${v.is_live}`);
    }
  }
}
check();
