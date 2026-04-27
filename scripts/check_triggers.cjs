const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_table_triggers', { table_name: 'vendor_profiles' });
  if (error) {
    console.error('Error checking triggers:', error);
  } else {
    console.log('Triggers:', data);
  }
}

checkTriggers();
