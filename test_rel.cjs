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
  const { data, error } = await supabase
    .from('products')
    .select('*, vendor(*)')
    .limit(1);
  
  if (error) {
    console.log('Query with vendor(*) FAILED:');
    console.log(error.message);
  } else {
    console.log('Query with vendor(*) SUCCESSFUL!');
  }

  const { data: data2, error: error2 } = await supabase
    .from('products')
    .select('*, vendor_profiles(*)')
    .limit(1);
  
  if (error2) {
    console.log('Query with vendor_profiles(*) FAILED:');
    console.log(error2.message);
  } else {
    console.log('Query with vendor_profiles(*) SUCCESSFUL!');
  }
}
check();
