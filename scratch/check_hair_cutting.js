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
  
  const { data, error } = await s.from('products').select('*').eq('slug', 'hair-cutting-3').single();
  
  if (error) {
    console.error('ERROR:', error);
  } else if (data) {
    console.log('Product:', JSON.stringify(data, null, 2));
  } else {
    console.log('Not found');
  }
}

test();
