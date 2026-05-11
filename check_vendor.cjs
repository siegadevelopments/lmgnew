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
    .eq('id', 'cf2123af-eeb6-42eb-b1e4-737796f9c356');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(vendor, null, 2));
  }
}
check();
