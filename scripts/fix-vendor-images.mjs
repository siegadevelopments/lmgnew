/**
 * Re-fetches product images from a vendor's own Shopify store (source of truth given
 * by the site owner) and re-uploads them to R2, for products whose stored image_url
 * currently 404s. Matches DB products to source products by normalized title, since
 * DB slugs don't reliably match Shopify handles for these vendors.
 *
 * Usage: node scripts/fix-vendor-images.mjs          (dry run, all 3 vendors)
 *        node scripts/fix-vendor-images.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const apply = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')];
  }),
);
const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const R2_DOMAIN = env.R2_CUSTOM_DOMAIN || 'media.lifestylemedicinegateway.com';
const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const VENDORS = [
  { store_name: 'Closer To Nature', shop: 'https://closertonature.shop', folder: 'closertonature' },
  { store_name: 'Go Organic Shopping Australia', shop: 'https://www.gos.net.au', folder: 'gos' },
  { store_name: 'Noosa Nude', shop: 'https://www.noosanude.com.au', folder: 'noosanude' },
];

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function toR2(url, folder, handle) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const ext = (url.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] || 'jpg').toLowerCase();
  const key = `${folder}/${handle}-${Date.now()}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME || 'media', Key: key,
    Body: Buffer.from(await res.arrayBuffer()), ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  }));
  return `https://${R2_DOMAIN}/${key}`;
}

let totalFixed = 0, totalUnmatched = 0, totalSkippedOk = 0;
for (const vendor of VENDORS) {
  console.log(`\n=== ${vendor.store_name} ===`);
  const { data: vp } = await supabase.from('vendor_profiles').select('id').eq('store_name', vendor.store_name).single();
  if (!vp) { console.log('  vendor not found'); continue; }

  const { data: products } = await supabase.from('products').select('id, title, slug, image_url').eq('vendor_id', vp.id).eq('status', 'published');
  const { products: sourceProducts } = await (await fetch(`${vendor.shop}/products.json?limit=250`)).json();
  const byNormTitle = new Map(sourceProducts.map((p) => [norm(p.title), p]));

  for (const p of products) {
    // Only touch products whose current image is actually broken.
    let broken = !p.image_url;
    if (p.image_url) {
      try {
        const r = await fetch(p.image_url, { method: 'HEAD' });
        broken = r.status !== 200;
      } catch {
        broken = true;
      }
    }
    if (!broken) { totalSkippedOk++; continue; }

    const src = byNormTitle.get(norm(p.title));
    const srcImage = src?.images?.[0]?.src;
    if (!src || !srcImage) {
      console.log(`  UNMATCHED: "${p.title}"`);
      totalUnmatched++;
      continue;
    }

    console.log(`  ${p.title} -> ${src.title} (${srcImage})`);
    if (apply) {
      try {
        const r2Url = await toR2(srcImage, vendor.folder, p.slug);
        const { error } = await supabase.from('products').update({ image_url: r2Url }).eq('id', p.id);
        if (error) throw error;
        totalFixed++;
      } catch (e) {
        console.log(`    FAILED: ${e.message}`);
      }
    }
  }
}
console.log(`\n${apply ? 'Fixed' : 'Would fix'}: matched products above. Already-OK skipped: ${totalSkippedOk}. Unmatched (need manual look): ${totalUnmatched}.${apply ? ` Actually updated: ${totalFixed}.` : ''}`);
