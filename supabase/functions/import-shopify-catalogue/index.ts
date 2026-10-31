// import-shopify-catalogue: Admin > Product Catalog > Import from Shopify, and the daily stock sync.
//
// Auth model (docs/DEVELOPMENT_STANDARDS.md section 2):
//   op "import": admins only (requireAuth). Imports one small batch of a vendor's Shopify catalogue
//                as DRAFT products, copying every image to Cloudflare R2. The admin screen calls it
//                repeatedly with the returned cursor until it comes back null.
//   op "sync":   the daily schedule (x-webhook-secret = SHOPIFY_SYNC_SECRET) or an admin. Sets each
//                imported variant's in-stock / out-of-stock flag from the vendor's store and
//                changes nothing else.
// verify_jwt is false in supabase/config.toml because the schedule has no Supabase session; every
// request is authorised here before any work happens.
//
// All decisions (address safety, mapping, image rewriting, the stock merge) live in
// _shared/shopify-import.ts and are tested there. This file only fetches and writes.
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.568.0";
// @ts-ignore
import sanitizeHtml from "npm:sanitize-html@2.13.0";
import { requireAuth, requireWebhookSecret } from "../_shared/auth.ts";
import {
  collectImageUrls,
  feedUrl,
  isAllowedImageUrl,
  mapProduct,
  mergeAvailability,
  parseStoreUrl,
  rewriteImages,
  type ShopifyProduct,
} from "../_shared/shopify-import.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 5; // products per call; image copying is the slow part
const FEED_PAGE_SIZE = 250; // Shopify's maximum for products.json
const MAX_FEED_PAGES = 40;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// @ts-ignore
const env = (name: string) => Deno.env.get(name) ?? "";

const sanitize = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "span", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
  });

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders, status: 200 });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid request" }, 400);
  }
  const op = String(body?.op ?? "");

  // Authorise before any work. The schedule presents the shared secret; everyone else must be an admin.
  const viaSecret = op === "sync" && req.headers.has("x-webhook-secret");
  const denied = viaSecret ? requireWebhookSecret(req, "SHOPIFY_SYNC_SECRET", corsHeaders) : await requireAuth(req, ["admin"], corsHeaders);
  if (denied) return denied;
  if (op !== "import" && op !== "sync") return reply({ error: "Unknown operation" }, 400);

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  try {
    return op === "import" ? await importBatch(admin, body) : await syncStores(admin, body);
  } catch (err) {
    console.error(`${op} failed:`, (err as Error)?.message);
    return reply({ error: "Something went wrong. Try again, or check the function logs." }, 500);
  }
});

// ---------------------------------------------------------------------------------------------
// Shopify feed

async function fetchFeedPage(origin: string, page: number): Promise<ShopifyProduct[]> {
  const res = await fetch(feedUrl(origin, page), {
    redirect: "manual", // never follow a redirect to another host
    headers: { Accept: "application/json", "User-Agent": "LifestyleMedicineGateway-Import/1.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
    throw new Error(`Store feed unavailable (${res.status})`);
  }
  const data = await res.json();
  if (!data || !Array.isArray(data.products)) throw new Error("Not a Shopify product feed");
  return data.products as ShopifyProduct[];
}

// ---------------------------------------------------------------------------------------------
// R2

function r2() {
  const endpoint = env("R2_ENDPOINT");
  const bucket = env("R2_BUCKET_NAME");
  const custom = env("R2_CUSTOM_DOMAIN");
  if (!env("R2_ACCESS_KEY_ID") || !env("R2_SECRET_ACCESS_KEY") || !endpoint || !bucket) {
    throw new Error("Missing R2 configuration secrets");
  }
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY") },
  });
  return { client, bucket, publicUrl: (key: string) => (custom ? `https://${custom}/${key}` : `${endpoint}/${bucket}/${key}`) };
}

/** Copies one Shopify CDN image into R2. Returns the R2 address, or null when it can't be copied. */
async function copyImage(store: ReturnType<typeof r2>, url: string, key: string): Promise<string | null> {
  if (!isAllowedImageUrl(url)) return null;
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!res.ok || !IMAGE_TYPES.includes(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
    await store.client.send(new PutObjectCommand({ Bucket: store.bucket, Key: key, Body: bytes, ContentType: type }));
    return store.publicUrl(key);
  } catch (err) {
    console.error("image copy failed:", (err as Error)?.message);
    return null;
  }
}

async function copyProductImages(store: ReturnType<typeof r2>, vendorId: string, ref: string, urls: string[]) {
  const copies: Record<string, string> = {};
  const failed: string[] = [];
  await Promise.all(
    urls.map(async (url, i) => {
      const ext = (new URL(url).pathname.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
      const copy = await copyImage(store, url, `products/${vendorId}/shopify/${ref}/${i + 1}.${ext}`);
      if (copy) copies[url] = copy;
      else failed.push(url);
    }),
  );
  return { copies, failed };
}

const issueText = (failed: string[]) =>
  `${failed.length} image${failed.length === 1 ? "" : "s"} could not be copied to R2 (e.g. ${failed[0].slice(0, 120)}). Fix it on the Shopify store and import again.`;

// ---------------------------------------------------------------------------------------------
// op: import

async function importBatch(admin: any, body: Record<string, unknown>) {
  const store = parseStoreUrl(String(body.storeUrl ?? ""));
  if (!store.ok) return reply({ error: store.reason }, 400);

  const vendorId = String(body.vendorId ?? "");
  if (!UUID.test(vendorId)) return reply({ error: "Choose a vendor." }, 400);
  const qty = body.startingQuantity === undefined ? 100 : Number(body.startingQuantity);
  if (!Number.isInteger(qty) || qty < 0 || qty > 100000) return reply({ error: "Starting quantity must be a whole number from 0 to 100000." }, 400);
  const cursor = (body.cursor ?? {}) as { page?: unknown; offset?: unknown };
  const page = cursor.page === undefined ? 1 : Number(cursor.page);
  const offset = cursor.offset === undefined ? 0 : Number(cursor.offset);
  if (!Number.isInteger(page) || page < 1 || page > MAX_FEED_PAGES || !Number.isInteger(offset) || offset < 0) {
    return reply({ error: "Invalid cursor" }, 400);
  }

  const { data: vendor } = await admin.from("vendor_profiles").select("id").eq("id", vendorId).maybeSingle();
  if (!vendor) return reply({ error: "That vendor doesn't exist." }, 400);

  let feed: ShopifyProduct[];
  try {
    feed = await fetchFeedPage(store.origin, page);
  } catch (err) {
    console.error("feed failed:", (err as Error)?.message);
    return reply({ error: "Couldn't read that store. Check the address is a Shopify store whose products are public." }, 422);
  }

  await admin.from("vendor_shopify_stores").upsert(
    { vendor_id: vendorId, store_url: store.origin, updated_at: new Date().toISOString() },
    { onConflict: "vendor_id" },
  );

  const media = r2();
  const result = { imported: 0, existing: 0, retried: 0, flagged: [] as Array<{ name: string; issue: string }>, skipped: [] as Array<{ name: string; reason: string }> };

  for (const p of feed.slice(offset, offset + BATCH_SIZE)) {
    const mapped = mapProduct(p, { startingQuantity: qty, sanitize });
    if (!mapped.ok) {
      result.skipped.push({ name: mapped.name, reason: mapped.reason });
      continue;
    }
    const d = mapped.draft;

    const { data: found } = await admin
      .from("products")
      .select("id, content, image_url, images, import_issue")
      .eq("vendor_id", vendorId)
      .eq("source_platform", d.source_platform)
      .eq("source_ref", d.source_ref)
      .maybeSingle();

    if (found && !found.import_issue) {
      result.existing += 1; // never overwrite what the admin or vendor has edited
      continue;
    }

    const { copies, failed } = await copyProductImages(media, vendorId, d.source_ref, collectImageUrls(p));
    const productImages = (p.images ?? []).map((i) => copies[i.src]).filter(Boolean) as string[];
    const issue = failed.length ? issueText(failed) : null;

    if (found) {
      // A flagged draft: retry only the images, and clear the flag once they all copied.
      const { error } = await admin
        .from("products")
        .update({
          content: rewriteImages(String(found.content ?? ""), copies),
          image_url: productImages[0] ?? found.image_url ?? null,
          images: productImages.length ? productImages : found.images ?? null,
          import_issue: issue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", found.id);
      if (error) {
        console.error("retry update failed:", error.message);
        result.skipped.push({ name: d.title, reason: "It could not be updated." });
      } else if (issue) result.flagged.push({ name: d.title, issue });
      else result.retried += 1;
      continue;
    }

    const { error } = await admin.from("products").insert({
      vendor_id: vendorId,
      title: d.title,
      slug: d.slug,
      content: rewriteImages(d.content, copies),
      price: d.price,
      stock: d.stock,
      status: "draft",
      brand: d.brand,
      category: d.category,
      tags: d.tags,
      variants: d.variants,
      product_type: "physical",
      image_url: productImages[0] ?? null,
      images: productImages,
      source_platform: d.source_platform,
      source_ref: d.source_ref,
      import_issue: issue,
    });
    if (error) {
      console.error("insert failed:", error.code, error.message);
      result.skipped.push({ name: d.title, reason: "It could not be saved." });
    } else if (issue) {
      result.imported += 1;
      result.flagged.push({ name: d.title, issue });
    } else result.imported += 1;
  }

  const nextOffset = offset + BATCH_SIZE;
  const next =
    nextOffset < feed.length ? { page, offset: nextOffset } : feed.length >= FEED_PAGE_SIZE && page < MAX_FEED_PAGES ? { page: page + 1, offset: 0 } : null;
  return reply({ ...result, next, pageProducts: feed.length });
}

// ---------------------------------------------------------------------------------------------
// op: sync

async function syncStores(admin: any, body: Record<string, unknown>) {
  let query = admin.from("vendor_shopify_stores").select("vendor_id, store_url").eq("sync_enabled", true);
  if (body.vendorId !== undefined) {
    if (!UUID.test(String(body.vendorId))) return reply({ error: "Invalid vendor" }, 400);
    query = query.eq("vendor_id", String(body.vendorId));
  }
  const { data: stores, error } = await query;
  if (error) throw new Error(error.message);

  const outcomes: Array<{ vendor_id: string; status: "ok" | "failed"; message: string }> = [];
  for (const s of stores ?? []) {
    let status: "ok" | "failed" = "ok";
    let message = "";
    try {
      message = await syncOneStore(admin, s.vendor_id, s.store_url);
    } catch (err) {
      status = "failed"; // nothing was changed for this vendor
      message = (err as Error)?.message?.slice(0, 200) || "Sync failed";
      console.error(`sync failed for ${s.vendor_id}:`, message);
    }
    await admin
      .from("vendor_shopify_stores")
      .update({ last_synced_at: new Date().toISOString(), last_sync_status: status, last_sync_message: message, updated_at: new Date().toISOString() })
      .eq("vendor_id", s.vendor_id);
    outcomes.push({ vendor_id: s.vendor_id, status, message });
  }
  return reply({ stores: outcomes });
}

async function syncOneStore(admin: any, vendorId: string, storeUrl: string): Promise<string> {
  const store = parseStoreUrl(storeUrl); // re-checked every time; the address is read back from the database
  if (!store.ok) throw new Error(store.reason);

  // Read the whole feed before changing anything, so a store that fails halfway changes nothing.
  const feed = new Map<string, ShopifyProduct>();
  for (let page = 1; page <= MAX_FEED_PAGES; page++) {
    const items = await fetchFeedPage(store.origin, page);
    for (const p of items) feed.set(String(p.id), p);
    if (items.length < FEED_PAGE_SIZE) break;
  }
  // An empty feed is far more likely a broken or paused store than a vendor with nothing left.
  if (feed.size === 0) throw new Error("The store returned no products, so nothing was changed.");

  const { data: products, error } = await admin
    .from("products")
    .select("id, variants, source_ref")
    .eq("vendor_id", vendorId)
    .eq("source_platform", "shopify");
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of products ?? []) {
    const variants = Array.isArray(row.variants) ? row.variants : [];
    const merged = mergeAvailability(variants, feed.get(String(row.source_ref)));
    if (!merged.changed) continue;
    const { error: upErr } = await admin.from("products").update({ variants: merged.variants, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    updated += 1;
  }
  return `Checked ${(products ?? []).length} products, updated ${updated}.`;
}
