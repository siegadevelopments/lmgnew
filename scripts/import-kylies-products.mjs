/**
 * Import all products from kylies.com.au (Shopify) into the LMG platform.
 * Images are downloaded from Shopify CDN and uploaded to Cloudflare R2.
 * 
 * Usage: node scripts/import-kylies-products.mjs
 * 
 * This script:
 * 1. Fetches all products from the Shopify products.json API (paginated)
 * 2. Looks up the "Kylie's Professional" vendor in vendor_profiles
 * 3. Downloads product images from Shopify and uploads them to Cloudflare R2
 * 4. Inserts each product with variants, R2 image URLs, descriptions, and prices
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, extname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local manually (no dotenv dependency)
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[key] = val;
}

// Supabase config
const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Cloudflare R2 config
const R2_ACCESS_KEY_ID = envVars.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = envVars.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = envVars.R2_ENDPOINT;
const R2_BUCKET_NAME = envVars.R2_BUCKET_NAME;
const R2_CUSTOM_DOMAIN = envVars.R2_CUSTOM_DOMAIN || "media.lifestylemedicinegateway.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
  console.error("Missing Cloudflare R2 credentials in .env.local (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const SHOPIFY_BASE = "https://kylies.com.au";
const BRAND_NAME = "Kylie's Professional";

// ---------- Helpers ----------

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Download an image from a URL and upload it to Cloudflare R2.
 * Returns the public R2 URL.
 */
async function uploadImageToR2(imageUrl, r2Key) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`    Failed to download image: ${response.status} ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: Buffer.from(arrayBuffer),
      ContentType: contentType,
    });

    await s3Client.send(uploadCommand);

    const r2Url = `https://${R2_CUSTOM_DOMAIN}/${r2Key}`;
    return r2Url;
  } catch (err) {
    console.error(`    R2 upload error for ${imageUrl}: ${err.message}`);
    return null;
  }
}

/**
 * Get the file extension from a Shopify CDN URL (stripping query params)
 */
function getExtFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    return extname(pathname) || ".jpg";
  } catch {
    return ".jpg";
  }
}

// ---------- Fetch all products from Shopify ----------

async function fetchAllShopifyProducts() {
  const allProducts = [];
  let page = 1;
  const limit = 250;

  while (true) {
    const url = `${SHOPIFY_BASE}/products.json?limit=${limit}&page=${page}`;
    console.log(`Fetching page ${page}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch page ${page}: ${response.status}`);
      break;
    }

    const data = await response.json();
    if (!data.products || data.products.length === 0) {
      break;
    }

    allProducts.push(...data.products);
    console.log(`  Got ${data.products.length} products (total: ${allProducts.length})`);

    if (data.products.length < limit) {
      break; // Last page
    }
    page++;
  }

  return allProducts;
}

// ---------- Main ----------

async function main() {
  console.log("=== Kylie's Professional Product Import ===");
  console.log("  Images will be uploaded to Cloudflare R2\n");

  // Step 1: Find the vendor
  console.log("Looking up vendor...");
  const { data: vendors, error: vendorError } = await supabase
    .from("vendor_profiles")
    .select("id, store_name")
    .ilike("store_name", `%Kylie%Professional%`);

  if (vendorError) {
    console.error("Error looking up vendor:", vendorError);
    process.exit(1);
  }

  let vendorId;
  if (vendors && vendors.length > 0) {
    vendorId = vendors[0].id;
    console.log(`Found vendor: "${vendors[0].store_name}" (ID: ${vendorId})`);
  } else {
    console.error("Vendor 'Kylie's Professional' not found in vendor_profiles.");
    console.error("Please create the vendor first, then re-run this script.");
    process.exit(1);
  }

  // Step 2: Check for existing products to avoid duplicates
  console.log("\nChecking for existing products...");
  const { data: existingProducts } = await supabase
    .from("products")
    .select("slug")
    .eq("vendor_id", vendorId);

  const existingSlugs = new Set((existingProducts || []).map(p => p.slug));
  console.log(`Found ${existingSlugs.size} existing products for this vendor.`);

  // Step 3: Fetch all products from Shopify
  console.log("\nFetching products from kylies.com.au...");
  const shopifyProducts = await fetchAllShopifyProducts();
  console.log(`\nTotal Shopify products: ${shopifyProducts.length}`);

  // Step 4: Insert products
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const sp of shopifyProducts) {
    const slug = makeSlug(sp.title);
    
    // Skip if already exists
    if (existingSlugs.has(slug)) {
      console.log(`  SKIP (exists): ${sp.title}`);
      skipped++;
      continue;
    }

    console.log(`\n  Processing: ${sp.title}`);

    // Upload primary image to R2
    let primaryImageUrl = null;
    if (sp.images && sp.images.length > 0) {
      const ext = getExtFromUrl(sp.images[0].src);
      const r2Key = `products/kylies-professional/${slug}${ext}`;
      console.log(`    Uploading primary image to R2: ${r2Key}`);
      primaryImageUrl = await uploadImageToR2(sp.images[0].src, r2Key);
      if (primaryImageUrl) {
        console.log(`    ✓ Image uploaded: ${primaryImageUrl}`);
      }
    }

    // Upload additional images to R2 and build gallery HTML
    const additionalImageUrls = [];
    if (sp.images && sp.images.length > 1) {
      for (let i = 1; i < sp.images.length; i++) {
        const ext = getExtFromUrl(sp.images[i].src);
        const r2Key = `products/kylies-professional/${slug}-${i + 1}${ext}`;
        console.log(`    Uploading additional image ${i + 1} to R2...`);
        const url = await uploadImageToR2(sp.images[i].src, r2Key);
        if (url) {
          additionalImageUrls.push(url);
        }
      }
    }

    // Build variants array matching the platform format: { id, title, price, available }
    const variants = sp.variants
      .filter(v => v.title !== "Default Title")
      .map((v, idx) => ({
        id: `v${idx + 1}`,
        title: v.title,
        price: parseFloat(v.price),
        available: v.available !== false,
      }));

    // Get the base price (first variant or lowest)
    const basePrice = sp.variants.length > 0
      ? parseFloat(sp.variants[0].price)
      : 0;

    // Build HTML content with description and additional R2 images
    let contentHtml = sp.body_html || "";
    
    if (additionalImageUrls.length > 0) {
      contentHtml += '\n<div class="product-gallery" style="margin-top: 20px;">';
      for (const imgUrl of additionalImageUrls) {
        contentHtml += `\n<img src="${imgUrl}" alt="${sp.title}" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />`;
      }
      contentHtml += '\n</div>';
    }


    const productData = {
      vendor_id: vendorId,
      title: sp.title,
      slug,
      price: basePrice,
      stock: 50,
      content: contentHtml,
      image_url: primaryImageUrl,
      status: "published",
      variants: variants.length > 0 ? variants : null,
      brand: BRAND_NAME,
      category: "Health & Beauty",
      product_type: "physical",
    };

    try {
      const { error } = await supabase.from("products").insert(productData);
      
      if (error) {
        // If slug conflict, try with suffix
        if (error.code === "23505") {
          productData.slug = `${slug}-kp`;
          const { error: retryError } = await supabase.from("products").insert(productData);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      console.log(`  ✓ INSERTED: ${sp.title} (${variants.length} variants, $${basePrice})`);
      inserted++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${sp.title} — ${err.message}`);
      failed++;
    }
  }

  console.log("\n=== Import Summary ===");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total processed: ${shopifyProducts.length}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
