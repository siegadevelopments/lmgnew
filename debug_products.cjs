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
  console.log("Checking products and their vendor status...");
  const { data, error } = await supabase
    .from('products')
    .select(`
      title, 
      slug, 
      status, 
      vendor_profiles!inner(store_name, is_approved, is_live)
    `)
    .limit(20);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Products found:", data.length);
    data.forEach(p => {
      const v = p.vendor_profiles;
      const visible = p.status === 'published' && v.is_approved && v.is_live;
      console.log(`[${visible ? 'VISIBLE' : 'HIDDEN '}] ${p.title.padEnd(40)} | Status: ${p.status.padEnd(10)} | Vendor: ${v.store_name.padEnd(20)} | Approved: ${v.is_approved} | Live: ${v.is_live}`);
    });
  }
}
check();
