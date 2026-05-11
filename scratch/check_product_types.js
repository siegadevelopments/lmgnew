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
  
  const { data, error } = await s.from('products').select('product_type, vendor_profiles(is_approved, is_live)');
  
  if (error) {
    console.error('ERROR:', error);
  } else if (data) {
    const counts = {};
    let liveServices = 0;
    data.forEach(p => {
      counts[p.product_type] = (counts[p.product_type] || 0) + 1;
      if (p.product_type === 'service' || p.product_type === 'Service') {
         if (p.vendor_profiles && p.vendor_profiles.is_approved && p.vendor_profiles.is_live) {
            liveServices++;
         }
      }
    });
    console.log('Product type counts:', counts);
    console.log('Live & approved services:', liveServices);
  }
}

test();
