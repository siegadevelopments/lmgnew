/**
 * Inserts Founder's Formula products that exist on the source Shopify store (AUD) but not in the DB.
 * Images are copied to R2. Usage: node scripts/import-missing-founders-products.mjs [--apply]
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

async function toR2(url, handle) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const key = `foundersformula/${handle}-${Date.now()}.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME || 'media', Key: key,
      Body: Buffer.from(await res.arrayBuffer()), ContentType: 'image/jpeg',
    }));
    return `https://${R2_DOMAIN}/${key}`;
  } catch (e) {
    console.error(`  R2 upload failed, keeping source URL: ${e.message}`);
    return url;
  }
}

const { data: sample } = await supabase.from('products').select('vendor_id').eq('brand', "Founder's Formula").limit(1).single();
const vendor_id = sample.vendor_id;

const { products } = await (await fetch('https://foundersformula.com.au/products.json?limit=250&currency=AUD')).json();
for (const p of products) {
  const { data: existing } = await supabase.from('products').select('id').eq('slug', p.handle).maybeSingle();
  if (existing) continue;

  console.log(`Missing: ${p.title} (${p.variants.map(v => v.price)})`);
  if (!apply) continue;

  const images = [];
  for (const img of p.images) images.push(await toR2(img.src, p.handle));
  const { error } = await supabase.from('products').insert({
    vendor_id,
    title: p.title,
    slug: p.handle,
    content: p.body_html,
    price: parseFloat(p.variants[0].price),
    image_url: images[0] ?? null,
    images: images.slice(1),
    stock: 100,
    status: 'published',
    brand: "Founder's Formula",
    category: 'Skincare',
    product_type: 'physical',
    variants: p.variants.map(v => ({
      sku: v.sku, price: v.price, stock: 100, title: v.title,
      option1: v.option1, option2: v.option2, option3: v.option3, available: v.available,
    })),
  });
  console.log(error ? `  FAILED: ${error.message}` : '  inserted');
}
