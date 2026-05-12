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
  
  // Test what the anon key (same as browser) can see
  const { data, error } = await s.from('service_availability').select('*').eq('product_id', 560);
  
  if (error) {
    console.error('service_availability ANON ERROR:', error);
  } else {
    console.log(`service_availability for product 560: ${data.length} rows`);
    data.forEach(row => {
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      console.log(`  - ${days[row.day_of_week]} (${row.day_of_week}): ${row.start_time} - ${row.end_time} (${row.slot_duration}min slots)`);
    });
  }
  
  // Also check bookings table access
  const { data: b, error: be } = await s.from('bookings').select('id').eq('product_id', 560).limit(1);
  if (be) {
    console.error('bookings ANON ERROR:', be);
  } else {
    console.log(`bookings for product 560: ${b.length} rows visible to anon`);
  }
}

test();
