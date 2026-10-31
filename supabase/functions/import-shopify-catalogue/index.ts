// import-shopify-catalogue: Admin > Product Catalog > Import from Shopify, and the daily stock sync.
//
// Auth model (docs/DEVELOPMENT_STANDARDS.md section 2):
//   op "import": admins only (requireAuth), with one exception: a background import's own next-batch
//                call (chained: true) presents the shared secret. Imports one small batch of a vendor's
//                Shopify catalogue as DRAFT products, copying every image to Cloudflare R2. With
//                background: true the function triggers the next batch itself and records progress on
//                vendor_shopify_stores, so it keeps going when the admin closes the page.
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
  isImportRunning,
  isSameSiteRedirect,
  mapProduct,
  mergeAvailability,
  mergeImportTotals,
  type ImportTotals,
  parseStoreUrl,
  planImport,
  rewriteImages,
  SANITIZE_OPTIONS,
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
const SYNC_BUDGET_MS = 100_000; // stop starting new stores near the Edge Function's time limit
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// @ts-ignore
const env = (name: string) => Deno.env.get(name) ?? "";

const sanitize = (html: string) =>
  sanitizeHtml(html, {
    ...SANITIZE_OPTIONS,
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
  const viaSecret =
    (op === "sync" || (op === "import" && body.chained === true)) && req.headers.has("x-webhook-secret");
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
  let url = feedUrl(origin, page);
  const host = new URL(origin).hostname;
  let res: Response | undefined;
  // Follow at most two redirects, and only the bare-domain <-> www kind (isSameSiteRedirect).
  for (let hop = 0; hop < 3; hop++) {
    res = await fetch(url, {
      redirect: "manual", // redirects are checked by hand, never followed to another host
      headers: { Accept: "application/json", "User-Agent": "LifestyleMedicineGateway-Import/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location && isSameSiteRedirect(host, location, url)) {
      url = new URL(location, url).toString();
      continue;
    }
    break;
  }
  if (!res || !res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
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
      // Relative, protocol-relative or off-CDN addresses are flagged, never allowed to throw.
      if (!isAllowedImageUrl(url)) {
        failed.push(url);
        return;
      }
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

  // A vendor has one linked store. Importing a different one would make the daily sync treat the
  // old catalogue as gone from the store and mark all of it out of stock.
  const { data: linked } = await admin.from("vendor_shopify_stores").select("store_url").eq("vendor_id", vendorId).maybeSingle();
  if (linked && linked.store_url !== store.origin) {
    return reply({ error: `This vendor is already linked to ${linked.store_url}. A vendor can only have one Shopify store.` }, 409);
  }

  const background = body.background === true;
  const chained = body.chained === true;
  if (background && !chained) {
    // Starting a background import: don't run two for one vendor at once (a stalled one may be restarted).
    const { data: state } = await admin.from("vendor_shopify_stores").select("import_status, import_updated_at").eq("vendor_id", vendorId).maybeSingle();
    if (isImportRunning(state?.import_status, state?.import_updated_at)) {
      return reply({ error: "An import for this vendor is already running." }, 409);
    }
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

    const plan = planImport(found);
    if (plan.action === "skip") {
      result.existing += 1; // never overwrite what the admin or vendor has edited
      continue;
    }

    const { copies, failed } = await copyProductImages(media, vendorId, d.source_ref, collectImageUrls(p));
    const productImages = (p.images ?? []).map((i) => copies[i.src]).filter(Boolean) as string[];
    const issue = failed.length ? issueText(failed) : null;

    if (plan.action === "retry") {
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
      status: plan.status,
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
  if (!background) return reply({ ...result, next });
  return await continueInBackground(admin, { vendorId, storeUrl: store.origin, qty, next, previous: body.totals, batch: result, fresh: !chained });
}

/** Records progress, then hands the next batch to a fresh invocation so no browser has to stay open. */
async function continueInBackground(
  admin: any,
  a: { vendorId: string; storeUrl: string; qty: number; next: { page: number; offset: number } | null; previous: unknown; batch: ImportTotals; fresh: boolean },
) {
  const totals = mergeImportTotals(a.previous as Partial<ImportTotals> | null, a.batch);
  const now = new Date().toISOString();
  const progress: Record<string, unknown> = {
    import_status: a.next ? "running" : "done",
    import_updated_at: now,
    import_summary: totals,
  };
  if (a.fresh) progress.import_started_at = now;
  await admin.from("vendor_shopify_stores").update(progress).eq("vendor_id", a.vendorId);

  if (a.next) {
    const chainBody = { op: "import", chained: true, background: true, storeUrl: a.storeUrl, vendorId: a.vendorId, startingQuantity: a.qty, cursor: a.next, totals };
    // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime
    const keepAlive = typeof EdgeRuntime !== "undefined" ? (p: Promise<unknown>) => EdgeRuntime.waitUntil(p) : (_p: Promise<unknown>) => {};
    keepAlive(callNextBatch(admin, a.vendorId, chainBody));
  }
  return reply({ ...totals, next: a.next, status: a.next ? "running" : "done" });
}

async function callNextBatch(admin: any, vendorId: string, chainBody: Record<string, unknown>) {
  let message = "";
  try {
    const res = await fetch(`${env("SUPABASE_URL")}/functions/v1/import-shopify-catalogue`, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "application/json", "x-webhook-secret": env("SHOPIFY_SYNC_SECRET") },
      body: JSON.stringify(chainBody),
      signal: AbortSignal.timeout(140000),
    });
    if (res.ok) return;
    const data = await res.json().catch(() => ({}));
    message = String(data?.error ?? `The next batch failed (${res.status}).`);
  } catch (err) {
    console.error("chained batch failed:", (err as Error)?.message);
    message = "The import stopped before it finished. Run it again to continue.";
  }
  const { data: row } = await admin.from("vendor_shopify_stores").select("import_summary").eq("vendor_id", vendorId).maybeSingle();
  await admin
    .from("vendor_shopify_stores")
    .update({ import_status: "failed", import_updated_at: new Date().toISOString(), import_summary: { ...(row?.import_summary ?? {}), message } })
    .eq("vendor_id", vendorId);
}

// ---------------------------------------------------------------------------------------------
// op: sync

async function syncStores(admin: any, body: Record<string, unknown>) {
  // The schedule syncs stores that have sync on, stalest first. An admin asking for one vendor gets it
  // synced whatever the switch says.
  let query = admin.from("vendor_shopify_stores").select("vendor_id, store_url").order("last_synced_at", { ascending: true, nullsFirst: true });
  if (body.vendorId !== undefined) {
    if (!UUID.test(String(body.vendorId))) return reply({ error: "Invalid vendor" }, 400);
    query = query.eq("vendor_id", String(body.vendorId));
  } else {
    query = query.eq("sync_enabled", true);
  }
  const { data: stores, error } = await query;
  if (error) throw new Error(error.message);

  const outcomes: Array<{ vendor_id: string; status: "ok" | "failed"; message: string }> = [];
  const deadline = Date.now() + SYNC_BUDGET_MS;
  for (const s of stores ?? []) {
    if (Date.now() > deadline) break; // the rest are the stalest next run, so none starves
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
