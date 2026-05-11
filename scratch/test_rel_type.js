import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function test() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = fs.readFileSync(envPath, 'utf8');
  const lines = env.split('\n');
  let url = '';
  let key = '';
  for (const l of lines) {
    if (l.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=')[1].replace(/"/g, '').trim();
    if (l.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = l.split('=')[1].replace(/"/g, '').trim();
  }
  
  console.log('Connecting to:', url);
  const s = createClient(url, key);
  
  const { data, error } = await s.from('products').select('*, vendor_profiles(store_name)').limit(1);
  
  if (error) {
    console.error('ERROR:', error);
  } else if (data && data.length > 0) {
    console.log('Product vendor_profiles type:', typeof data[0].vendor_profiles);
    console.log('Product vendor_profiles data:', JSON.stringify(data[0].vendor_profiles, null, 2));
  } else {
    console.log('No products found');
  }
}

test();
