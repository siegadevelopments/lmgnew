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
  
  const s = createClient(url, key);
  
  const { data, error } = await s.from('products').select('title, product_type, vendor_profiles(is_approved, is_live)').eq('product_type', 'service');
  
  if (error) {
    console.error('ERROR:', error);
  } else if (data) {
    console.log('Services:', JSON.stringify(data, null, 2));
  }
}

test();
