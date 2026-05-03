const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function forceCacheRefresh() {
  console.log('Attempting to force schema cache refresh...');
  // We can't easily run DDL via the client unless we have an RPC.
  // But maybe selecting with a specific header works?
  const { data, error } = await supabase.from('vendor_profiles').select('*').limit(1).setHeader('x-postgrest-schema-cache', 'refresh');
  
  if (error) {
    console.error('Refresh attempt failed:', error);
  } else {
    console.log('Refresh attempt sent.');
  }
}

forceCacheRefresh();
