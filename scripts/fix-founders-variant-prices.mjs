/**
 * Re-syncs Founder's Formula variant prices (and base price) from the source Shopify store in AUD.
 * The original import stored variant prices in the wrong currency/scale (e.g. "2900.00" for a $63 product).
 *
 * Usage: node scripts/fix-founders-variant-prices.mjs          (dry run)
 *        node scripts/fix-founders-variant-prices.mjs --apply  (writes to Supabase)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const apply = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')];
  }),
);
const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const res = await fetch('https://foundersformula.com.au/products.json?limit=250&currency=AUD');
const { products } = await res.json();

let changed = 0, unmatched = 0;
for (const p of products) {
  const { data: row } = await supabase.from('products').select('id, price, variants').eq('slug', p.handle).maybeSingle();
  if (!row) { console.log(`No DB row for ${p.handle}`); unmatched++; continue; }

  const variants = (row.variants || []).map((v, i) => {
    const src = p.variants.find(s => s.title === v.title) || (v.sku && p.variants.find(s => s.sku === v.sku)) || p.variants[i];
    return src ? { ...v, price: src.price } : v;
  });
  const price = parseFloat(p.variants[0].price);

  const same = Number(row.price) === price && variants.every((v, i) => v.price === row.variants[i].price);
  if (same) continue;
  changed++;
  console.log(`${p.title}: ${row.price} -> ${price} | ${row.variants?.map(v => v.price)} -> ${variants.map(v => v.price)}`);
  if (apply) {
    const { error } = await supabase.from('products').update({ price, variants }).eq('id', row.id);
    if (error) console.error('  FAILED', error.message);
  }
}
console.log(`${apply ? 'Updated' : 'Would update'} ${changed} products, ${unmatched} unmatched.`);
