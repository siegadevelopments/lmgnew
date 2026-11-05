/**
 * Import products from lavvish.com.au (WooCommerce) into the LMG platform.
 * Uses WooCommerce's public Store API (no keys needed) and mirrors images to Cloudflare R2.
 *
 * Usage:
 *   node scripts/import-lavvish-products.mjs            # dry run: fetch + report, writes nothing
 *   node scripts/import-lavvish-products.mjs --apply    # upload images to R2 and insert products
 *
 * Requires the vendor to have created their store first (products.vendor_id references
 * vendor_profiles). The vendor is found by email via the auth admin API (default
 * sales@lavvish.com.au; override with VENDOR_EMAIL=...).
 *
 * Products are inserted as "draft" so the vendor/admin can review before publishing.
 * Re-running is safe: products already imported (source_platform + source_ref) are skipped.
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, extname } from "path";

const APPLY = process.argv.includes("--apply");
const SOURCE = "https://lavvish.com.au";
const SOURCE_PLATFORM = "woocommerce";
const BRAND_NAME = "Lavvish";
const VENDOR_EMAIL = process.env.VENDOR_EMAIL || "sales@lavvish.com.au";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(resolve(__dirname, "../.env.local"), "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const R2_CUSTOM_DOMAIN = env.R2_CUSTOM_DOMAIN || "media.lifestylemedicinegateway.com";

// ---------- helpers ----------

function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

function makeSlug(title) {
  return title.toLowerCase().replace(/['’]/g, "").replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 100)
    .replace(/-$/, "");
}

const price = (p) => {
  const minor = Number(p?.currency_minor_unit ?? 2);
  return Number(p?.price ?? 0) / 10 ** minor;
};

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function fetchAll() {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await getJson(`${SOURCE}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function buildVariants(p) {
  if (p.type !== "variable" || !p.variations?.length) return null;
  const out = [];
  for (const [idx, v] of p.variations.entries()) {
    try {
      const d = await getJson(`${SOURCE}/wp-json/wc/store/v1/products/${v.id}`);
      const label = (v.attributes || []).map((a) => decodeEntities(a.value)).join(" / ") || `Option ${idx + 1}`;
      out.push({ id: `v${idx + 1}`, title: label, price: price(d.prices), available: d.is_in_stock !== false });
    } catch (e) {
      console.warn(`    could not fetch variation ${v.id}: ${e.message}`);
    }
  }
  return out.length ? out : null;
}

// ---------- main ----------

async function main() {
  console.log(`=== Lavvish product import (${APPLY ? "APPLY" : "DRY RUN"}) ===`);
  const products = await fetchAll();
  console.log(`Fetched ${products.length} products from ${SOURCE}`);

  if (!APPLY) {
    const sample = products.slice(0, 5).map((p) => `  - ${decodeEntities(p.name).slice(0, 70)} | $${price(p.prices)} | ${p.type} | ${p.images?.length ?? 0} img`);
    console.log(sample.join("\n"));
    console.log(`Types: ${JSON.stringify(products.reduce((a, p) => ((a[p.type] = (a[p.type] || 0) + 1), a), {}))}`);
    console.log("Dry run only. Re-run with --apply to import.");
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  for (const k of ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "R2_BUCKET_NAME"]) {
    if (!env[k]) throw new Error(`Missing ${k} in .env.local`);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const s3 = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });

  // Find the vendor's user id by email, then require their vendor_profiles row.
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) throw uErr;
  const user = users.users.find((u) => u.email?.toLowerCase() === VENDOR_EMAIL.toLowerCase());
  if (!user) throw new Error(`No user with email ${VENDOR_EMAIL}`);
  const { data: vendor } = await supabase.from("vendor_profiles").select("id, store_name").eq("id", user.id).maybeSingle();
  if (!vendor) throw new Error(`${VENDOR_EMAIL} has no vendor_profiles row yet. They must create their store first.`);
  console.log(`Vendor: "${vendor.store_name}" (${vendor.id})`);

  const { data: existing } = await supabase.from("products").select("slug, source_ref").eq("vendor_id", vendor.id);
  const seenRefs = new Set((existing || []).filter((p) => p.source_ref).map((p) => p.source_ref));
  const usedSlugs = new Set((existing || []).map((p) => p.slug));

  async function toR2(src, key) {
    try {
      const r = await fetch(src);
      if (!r.ok) return null;
      await s3.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME, Key: key,
        Body: Buffer.from(await r.arrayBuffer()),
        ContentType: r.headers.get("content-type") || "image/jpeg",
      }));
      return `https://${R2_CUSTOM_DOMAIN}/${key}`;
    } catch (e) {
      console.warn(`    image failed ${src}: ${e.message}`);
      return null;
    }
  }

  let inserted = 0, skipped = 0, failed = 0;
  for (const p of products) {
    const ref = String(p.id);
    const title = decodeEntities(p.name);
    if (seenRefs.has(ref)) { skipped++; continue; }

    let slug = makeSlug(title) || `product-${ref}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${ref}`;
    usedSlugs.add(slug);

    const urls = [];
    for (const [i, img] of (p.images || []).entries()) {
      const ext = extname(new URL(img.src).pathname) || ".jpg";
      const url = await toR2(img.src, `products/lavvish/${slug}${i ? `-${i + 1}` : ""}${ext}`);
      if (url) urls.push(url);
    }

    const variants = await buildVariants(p);
    const row = {
      vendor_id: vendor.id,
      title,
      slug,
      excerpt: decodeEntities(p.short_description).replace(/<[^>]*>/g, "").trim() || null,
      content: p.description || "",
      price: variants ? Math.min(...variants.map((v) => v.price)) : price(p.prices),
      stock: p.is_in_stock ? 50 : 0,
      image_url: urls[0] ?? null,
      images: urls.length ? urls : null,
      status: "draft",
      variants,
      brand: BRAND_NAME,
      product_type: "physical",
      source_platform: SOURCE_PLATFORM,
      source_ref: ref,
    };

    const { error } = await supabase.from("products").insert(row);
    if (error) { console.error(`  FAILED ${title.slice(0, 60)}: ${error.message}`); failed++; }
    else { console.log(`  inserted ${title.slice(0, 60)} ($${row.price})`); inserted++; }
  }

  console.log(`\nInserted ${inserted}, skipped ${skipped}, failed ${failed} of ${products.length}`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
