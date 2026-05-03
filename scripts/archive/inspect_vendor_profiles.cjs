const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'vendor_profiles' });
  if (error) {
    console.error('Error inspecting table:', error);
    // Fallback: try to select one row and see the keys
    const { data: row } = await supabase.from('vendor_profiles').select('*').limit(1).single();
    console.log('Columns from sample row:', Object.keys(row || {}));
  } else {
    console.log('Columns:', data.map(c => c.column_name));
  }
}

inspect();
