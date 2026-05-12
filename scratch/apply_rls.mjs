import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (key) => {
  const line = env.split('\n').find(l => l.trim().startsWith(key + '='));
  return line ? line.split('=').slice(1).join('=').replace(/"/g, '').trim() : '';
};

const url = get('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = get('SUPABASE_SERVICE_ROLE_KEY');

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const s = createClient(url, serviceKey);

// The only DDL we can run is through Supabase's pg_meta API
// Let's try running each policy statement via an edge function or pg meta
// Instead: use the REST API for pg meta (available in hosted Supabase)
const projectRef = 'usrtaxvjwidfxajbjlpj';

const policies = [
  {
    name: 'Vendors can view their bookings',
    schema: 'public',
    table: 'bookings',
    action: 'SELECT',
    definition: 'vendor_id = auth.uid()',
    check: null,
    command: 'SELECT',
    roles: ['authenticated'],
  },
  {
    name: 'Vendors can update their bookings',
    schema: 'public',
    table: 'bookings',
    action: 'UPDATE',
    definition: 'vendor_id = auth.uid()',
    check: 'vendor_id = auth.uid()',
    command: 'UPDATE',
    roles: ['authenticated'],
  },
  {
    name: 'Customers can view their bookings',
    schema: 'public',
    table: 'bookings',
    action: 'SELECT',
    definition: 'customer_id = auth.uid()',
    check: null,
    command: 'SELECT',
    roles: ['authenticated'],
  },
  {
    name: 'Authenticated users can insert bookings',
    schema: 'public',
    table: 'bookings',
    action: 'INSERT',
    definition: null,
    check: 'customer_id = auth.uid()',
    command: 'INSERT',
    roles: ['authenticated'],
  },
];

const anonKey = get('NEXT_PUBLIC_SUPABASE_ANON_KEY');

for (const p of policies) {
  const body = {
    name: p.name,
    schema: p.schema,
    table: p.table,
    action: p.command,
    definition: p.definition,
    check: p.check,
    roles: p.roles,
  };

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/policies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    if (json.message && json.message.includes('already exists')) {
      console.log(`Policy "${p.name}" already exists — skipping`);
    } else {
      console.error(`Failed to create policy "${p.name}":`, JSON.stringify(json));
    }
  } else {
    console.log(`Created policy: "${p.name}"`);
  }
}

console.log('Done.');
