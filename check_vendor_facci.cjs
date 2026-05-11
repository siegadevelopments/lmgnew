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
  const { data: vendor, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('id', '05405cad-926a-466a-bc28-2ad719cf50e7');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(vendor, null, 2));
  }
}
check();
