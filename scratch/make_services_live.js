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
  
  const { data: services, error } = await s.from('products').select('vendor_id').eq('product_type', 'service');
  
  if (error) {
    console.error('ERROR fetching services:', error);
    return;
  }
  
  if (services && services.length > 0) {
    const vendorIds = [...new Set(services.map(s => s.vendor_id))].filter(Boolean);
    console.log('Vendor IDs to make live:', vendorIds);
    
    for (const vid of vendorIds) {
      const { error: updateError } = await s.from('vendor_profiles').update({ is_live: true, is_approved: true }).eq('id', vid);
      if (updateError) {
        console.error('Error updating vendor', vid, updateError);
      } else {
        console.log('Successfully made vendor live:', vid);
      }
    }
  } else {
    console.log('No services found');
  }
}

test();
