const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  const { data: vendor } = await supabase.from('vendor_profiles').select('id').limit(1).single();
  if (!vendor) return console.log('No vendor found');
  
  console.log('Testing update for vendor:', vendor.id);
  const { data, error } = await supabase
    .from('vendor_profiles')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', vendor.id)
    .select('id');
    
  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update success:', data);
  }
}

testUpdate();
