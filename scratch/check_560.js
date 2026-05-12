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
  
  const { data, error } = await s.from('service_availability').select('*').eq('product_id', 560);
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('service_availability for 560:', JSON.stringify(data, null, 2));
  }
}

test();
