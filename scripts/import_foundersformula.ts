import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
  return acc;
}, {});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = env.R2_ENDPOINT;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME || 'media';
const R2_CUSTOM_DOMAIN = env.R2_CUSTOM_DOMAIN || 'media.lifestylemedicinegateway.com';

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
  console.error("Missing R2 credentials. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT in .env.local.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadImageToR2(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine content type from URL or default to webp/png/jpg based on typical Shopify URLs
    let contentType = 'image/jpeg';
    if (url.includes('.png')) contentType = 'image/png';
    else if (url.includes('.webp')) contentType = 'image/webp';
    else if (url.includes('.gif')) contentType = 'image/gif';

    const r2Path = `foundersformula/${filename}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Path,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // R2 typically manages this differently but we can pass it
    }));

    return `https://${R2_CUSTOM_DOMAIN}/${r2Path}`;
  } catch (error) {
    console.error(`Error uploading image to R2 from ${url}:`, error);
    return null;
  }
}


async function main() {
  console.log("Starting Founder's Formula import (with R2 Image Uploads)...");

  const email = "vendor@foundersformula.com.au";
  let userId;

  console.log(`Checking if user ${email} exists...`);
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find(u => u.email === email);
  if (!user) {
     console.error("User not found! Please run the first import script to create the user, or check credentials.");
     process.exit(1);
  }
  userId = user.id;

  console.log("Fetching products from foundersformula.com.au...");
  const res = await fetch('https://foundersformula.com.au/products.json?limit=250');
  const data = await res.json();
  const products = data.products;
  console.log(`Found ${products.length} products.`);

  let successCount = 0;
  for (const p of products) {
    let imageUrl = (p.images && p.images.length > 0) ? p.images[0].src : null;
    
    if (imageUrl) {
        console.log(`Processing image for product: ${p.title}`);
        // Ensure valid filename
        const filename = `${p.handle}-${Date.now()}.jpg`;
        const newUrl = await uploadImageToR2(imageUrl, filename);
        if (newUrl) {
            imageUrl = newUrl;
        } else {
            console.log(`Skipping R2 upload, keeping original URL for ${p.title}`);
        }
    }

    const payload = {
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    };

    console.log(`Updating product ${p.handle}...`);
    const { error } = await supabase
        .from('products')
        .update(payload as any)
        .eq('slug', p.handle)
        .eq('vendor_id', userId);

    if (error) {
       console.error(`Failed to update ${p.title}:`, error);
    } else {
       successCount++;
    }
  }

  console.log(`Successfully updated ${successCount} products with R2 images!`);
}

main().catch(console.error);
