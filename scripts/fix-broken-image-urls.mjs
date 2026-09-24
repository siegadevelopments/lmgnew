/**
 * Fixes product image_url values corrupted with a literal " (1)." segment
 * (e.g. "https://media.lifestylemedicinegateway.com/ (1).uploads/2026/04/x.png"
 * instead of ".../uploads/2026/04/x.png"). This isn't a valid URL, so Stripe
 * rejected checkout with "Not a valid URL" for any cart containing one of
 * these products.
 *
 * Usage: node scripts/fix-broken-image-urls.mjs          (dry run)
 *        node scripts/fix-broken-image-urls.mjs --apply  (writes to Supabase)
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

const { data, error } = await supabase.from('products').select('id, title, image_url').eq('status', 'published');
if (error) { console.error(error); process.exit(1); }

const broken = data.filter((p) => p.image_url && p.image_url.includes(' (1).uploads'));
console.log(`Found ${broken.length} products with the broken image URL.`);

let fixed = 0;
for (const p of broken) {
  const clean = p.image_url.replace(' (1).uploads', 'uploads');
  console.log(`${p.title}: ${p.image_url} -> ${clean}`);
  if (apply) {
    const { error: updateError } = await supabase.from('products').update({ image_url: clean }).eq('id', p.id);
    if (updateError) console.error(`  FAILED: ${updateError.message}`);
    else fixed++;
  }
}
console.log(apply ? `Fixed ${fixed} of ${broken.length}.` : `Would fix ${broken.length}. Re-run with --apply to write.`);
