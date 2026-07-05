#!/usr/bin/env node

/**
 * Duplicate Image Audit Script
 * =============================
 * Scans Supabase DB + Supabase Storage to find:
 *   1. DB records still pointing to Supabase Storage when migration to R2 should have moved them
 *   2. Orphaned files in Supabase Storage (not referenced by any DB record) 
 *   3. Images embedded in article/recipe HTML body content referencing Supabase Storage
 *   4. URL classification — how many point to Supabase vs R2 vs external
 *   5. Duplicate URL detection — same image URL used by multiple records
 *
 * Requires only @supabase/supabase-js (already installed).
 * For full R2 audit with file listing, set R2 env vars and install @aws-sdk/client-s3.
 *
 * Usage:
 *   node scripts/audit-duplicate-images.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
    console.log("✅ Loaded .env.local");
  }
} catch (e) {
  console.log("⚠️  Could not load .env.local:", e.message);
}

// ── Configuration ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN || "media.lifestylemedicinegateway.com";

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractStorageKey(url) {
  if (!url || typeof url !== "string") return null;

  // Supabase Storage URL → key
  if (url.includes("/storage/v1/object/public/media/")) {
    const parts = url.split("/storage/v1/object/public/media/");
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  }

  // R2 Custom domain URL → key
  if (R2_CUSTOM_DOMAIN && url.includes(R2_CUSTOM_DOMAIN)) {
    const parts = url.split(`${R2_CUSTOM_DOMAIN}/`);
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  }

  // Generic R2 URL
  if (url.includes("r2.cloudflarestorage.com") || url.includes("r2.dev")) {
    const parts = url.split("/");
    return parts.slice(4).join("/") || null;
  }

  return null;
}

function classifyUrl(url) {
  if (!url || typeof url !== "string") return "unknown";
  if (url.includes("/storage/v1/object/public/")) return "supabase";
  if (R2_CUSTOM_DOMAIN && url.includes(R2_CUSTOM_DOMAIN)) return "r2";
  if (url.includes("r2.cloudflarestorage.com") || url.includes("r2.dev")) return "r2";
  if (url.includes("unsplash.com") || url.includes("images.unsplash.com")) return "external-unsplash";
  if (url.includes("pollinations.ai")) return "external-pollinations";
  if (url.includes("wp-content/uploads")) return "legacy-wordpress";
  return "external-other";
}

function extractImageUrlsFromHtml(html) {
  if (!html || typeof html !== "string") return [];
  const urls = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║     🔍 DUPLICATE IMAGE AUDIT — Supabase + R2           ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    console.error("❌ No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY.");
    process.exit(1);
  }
  console.log(`Using key type: ${SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE (full access)" : "ANON (limited access)"}`);
  const supabase = createClient(SUPABASE_URL, supabaseKey);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Scan all DB tables for image URLs
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 PHASE 1: Scanning database tables for image references");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const targets = [
    { table: "recipes", columns: ["image_url"], bodyColumn: "body" },
    { table: "articles", columns: ["image_url"], bodyColumn: "body" },
    { table: "gallery_items", columns: ["image_url"] },
    { table: "vendor_profiles", columns: ["store_logo_url", "store_banner_url", "banner_url"] },
    { table: "products", columns: ["image_url"] },
    { table: "services", columns: ["image_url"] },
    { table: "profiles", columns: ["avatar_url"] },
    { table: "videos", columns: ["embed_url", "thumbnail_url"] },
  ];

  const dbReferences = [];
  const bodyReferences = [];
  const supabaseDbKeys = new Set();
  const r2DbKeys = new Set();

  for (const target of targets) {
    try {
      const selectCols = ["id", "slug", ...target.columns];
      if (target.bodyColumn) selectCols.push(target.bodyColumn);

      const { data: rows, error } = await supabase
        .from(target.table)
        .select(selectCols.join(", "));

      if (error) {
        console.log(`  ⚠️  Skipping "${target.table}": ${error.message}`);
        continue;
      }
      if (!rows || rows.length === 0) {
        console.log(`  📋 ${target.table}: 0 rows`);
        continue;
      }

      let tableImageCount = 0;

      for (const row of rows) {
        const rowId = row.id || row.slug || "unknown";

        for (const col of target.columns) {
          const url = row[col];
          if (url && typeof url === "string" && url.startsWith("http")) {
            const key = extractStorageKey(url);
            const storage = classifyUrl(url);
            dbReferences.push({ table: target.table, column: col, id: rowId, url, key, storage });
            if (storage === "supabase" && key) supabaseDbKeys.add(key);
            if (storage === "r2" && key) r2DbKeys.add(key);
            tableImageCount++;
          }
        }

        if (target.bodyColumn && row[target.bodyColumn]) {
          const embeddedUrls = extractImageUrlsFromHtml(row[target.bodyColumn]);
          for (const url of embeddedUrls) {
            if (url.startsWith("http")) {
              const key = extractStorageKey(url);
              const storage = classifyUrl(url);
              bodyReferences.push({ table: target.table, id: rowId, url, key, storage });
              if (storage === "supabase" && key) supabaseDbKeys.add(key);
              if (storage === "r2" && key) r2DbKeys.add(key);
            }
          }
        }
      }

      console.log(`  📋 ${target.table}: ${rows.length} rows, ${tableImageCount} image URL(s) in columns`);
    } catch (err) {
      console.error(`  ❌ Error scanning "${target.table}":`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: List Supabase Storage files
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦 PHASE 2: Listing Supabase Storage files");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const supabaseStorageKeys = new Set();

  async function listAllSupabaseFiles(bucket, folderPath = "") {
    try {
      const { data: items, error } = await supabase.storage
        .from(bucket)
        .list(folderPath, { limit: 500 });

      if (error) {
        console.log(`  ⚠️  Could not list "${bucket}/${folderPath}": ${error.message}`);
        return;
      }
      if (!items) return;

      for (const item of items) {
        const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.metadata || item.id) {
          supabaseStorageKeys.add(itemPath);
        } else {
          await listAllSupabaseFiles(bucket, itemPath);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Error listing "${folderPath}":`, err.message);
    }
  }

  await listAllSupabaseFiles("media");
  console.log(`  Found ${supabaseStorageKeys.size} files in Supabase Storage "media" bucket.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Cross-reference analysis
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔄 PHASE 3: Cross-referencing for duplicates & waste");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 3A: Files in Supabase Storage that ALSO have a key referenced via R2 in the DB
  //     This means the file exists in Supabase AND R2 → double storage cost
  const potentialDuplicates = [];
  for (const key of supabaseStorageKeys) {
    if (r2DbKeys.has(key)) {
      potentialDuplicates.push(key);
    }
  }

  // 3B: DB records pointing to Supabase URL, but the same key exists in Supabase Storage
  //     AND was also migrated to R2 (key appears in r2DbKeys from other records)
  const staleSupabaseRefs = [];
  for (const ref of dbReferences) {
    if (ref.storage === "supabase" && ref.key) {
      staleSupabaseRefs.push(ref);
    }
  }

  // 3C: Orphaned Supabase files (in storage but no DB column reference AND no body reference)
  const allReferencedSupabaseKeys = new Set([...supabaseDbKeys]);
  // Also add keys from body references that point to Supabase
  for (const ref of bodyReferences) {
    if (ref.storage === "supabase" && ref.key) allReferencedSupabaseKeys.add(ref.key);
  }

  const orphanedSupabase = [];
  for (const key of supabaseStorageKeys) {
    if (!allReferencedSupabaseKeys.has(key)) {
      orphanedSupabase.push(key);
    }
  }

  // 3D: URL classification
  const supabaseUrlRefs = dbReferences.filter(r => r.storage === "supabase");
  const r2UrlRefs = dbReferences.filter(r => r.storage === "r2");
  const externalRefs = dbReferences.filter(r => r.storage.startsWith("external") || r.storage === "legacy-wordpress");

  // 3E: Shared URLs
  const urlUsageCount = {};
  for (const ref of dbReferences) {
    if (!urlUsageCount[ref.url]) urlUsageCount[ref.url] = [];
    urlUsageCount[ref.url].push(`${ref.table}.${ref.column} (id: ${ref.id})`);
  }
  const sharedUrls = Object.entries(urlUsageCount).filter(([_, refs]) => refs.length > 1);

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    📋 AUDIT REPORT                      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Summary
  console.log("📊 SUMMARY");
  console.log("─────────────────────────────────────────────────");
  console.log(`  DB image references (columns):     ${dbReferences.length}`);
  console.log(`  DB image references (body HTML):    ${bodyReferences.length}`);
  console.log(`  Supabase Storage files:             ${supabaseStorageKeys.size}`);
  console.log("");
  console.log("  URL classification:");
  console.log(`    → Pointing to Supabase Storage:   ${supabaseUrlRefs.length}`);
  console.log(`    → Pointing to R2 (${R2_CUSTOM_DOMAIN}): ${r2UrlRefs.length}`);
  console.log(`    → External (unsplash/wp/etc):     ${externalRefs.length}`);

  // Supabase storage files still remaining
  console.log("\n\n🔴 SUPABASE STORAGE: Files still stored (using your 1GB quota!)");
  console.log("─────────────────────────────────────────────────");
  if (supabaseStorageKeys.size === 0) {
    console.log("  ✅ Supabase Storage is empty! All migrated to R2.");
  } else {
    console.log(`  ⚠️  ${supabaseStorageKeys.size} files still in Supabase Storage:`);
    const sortedKeys = [...supabaseStorageKeys].sort();
    for (const key of sortedKeys.slice(0, 40)) {
      const isReferenced = allReferencedSupabaseKeys.has(key);
      const alsoInR2 = r2DbKeys.has(key);
      let status = "";
      if (alsoInR2) status = "🔴 DUPLICATE (also in R2)";
      else if (isReferenced) status = "🟡 Referenced (DB still points here)";
      else status = "🟠 ORPHAN (not referenced)";
      console.log(`    ${status}  ${key}`);
    }
    if (sortedKeys.length > 40) {
      console.log(`    ... and ${sortedKeys.length - 40} more`);
    }
  }

  // Potential duplicates
  console.log("\n\n🔴 DUPLICATES: Supabase files where R2 copy is referenced in DB");
  console.log("─────────────────────────────────────────────────");
  if (potentialDuplicates.length === 0) {
    console.log("  ✅ No detected duplicates where both Supabase & R2 copies exist.");
  } else {
    console.log(`  ⚠️  ${potentialDuplicates.length} file(s) appear to exist in BOTH Supabase & R2:`);
    for (const key of potentialDuplicates) {
      console.log(`    • ${key}`);
      console.log(`      Supabase: ${SUPABASE_URL}/storage/v1/object/public/media/${key}`);
      console.log(`      R2:       https://${R2_CUSTOM_DOMAIN}/${key}`);
    }
    console.log(`\n  🔧 Fix: Delete these from Supabase Storage — R2 copy already serves them.`);
  }

  // Stale Supabase references
  console.log("\n\n🟡 DB RECORDS STILL POINTING TO SUPABASE STORAGE");
  console.log("─────────────────────────────────────────────────");
  if (staleSupabaseRefs.length === 0) {
    console.log("  ✅ No DB records point to Supabase Storage — migration complete!");
  } else {
    console.log(`  ⚠️  ${staleSupabaseRefs.length} DB record(s) still reference Supabase Storage:`);
    // Group by table for readability
    const byTable = {};
    for (const ref of staleSupabaseRefs) {
      if (!byTable[ref.table]) byTable[ref.table] = [];
      byTable[ref.table].push(ref);
    }
    for (const [table, refs] of Object.entries(byTable)) {
      console.log(`\n    📋 ${table} (${refs.length} records):`);
      for (const ref of refs.slice(0, 10)) {
        console.log(`      • ${ref.column} (id: ${ref.id})`);
        console.log(`        URL: ${ref.url}`);
        if (ref.key) {
          console.log(`        → Suggested R2 URL: https://${R2_CUSTOM_DOMAIN}/${ref.key}`);
        }
      }
      if (refs.length > 10) {
        console.log(`      ... and ${refs.length - 10} more`);
      }
    }
    console.log(`\n  🔧 Fix: Run migrate-to-r2 Edge Function or scripts/migrate-to-r2.mjs`);
  }

  // Orphaned Supabase files
  console.log("\n\n🟠 ORPHANED SUPABASE FILES: In storage but NOT referenced anywhere");
  console.log("─────────────────────────────────────────────────");
  if (orphanedSupabase.length === 0) {
    console.log("  ✅ No orphaned Supabase files!");
  } else {
    console.log(`  ⚠️  ${orphanedSupabase.length} orphaned file(s) — safe to delete:`);
    for (const key of orphanedSupabase.slice(0, 30)) {
      console.log(`    • ${key}`);
    }
    if (orphanedSupabase.length > 30) {
      console.log(`    ... and ${orphanedSupabase.length - 30} more`);
    }
    console.log(`\n  🔧 Fix: Run cleanup-storage Edge Function or delete manually.`);
    console.log(`  This will free quota in your Supabase Storage (1GB free tier!)`);
  }

  // Body content images still referencing Supabase
  const bodySupabaseRefs = bodyReferences.filter(r => r.storage === "supabase");
  console.log("\n\n📝 BODY CONTENT: Images embedded in article/recipe HTML");
  console.log("─────────────────────────────────────────────────");
  if (bodyReferences.length === 0) {
    console.log("  No embedded images found in body content.");
  } else {
    const bodyByStorage = {};
    for (const ref of bodyReferences) {
      if (!bodyByStorage[ref.storage]) bodyByStorage[ref.storage] = 0;
      bodyByStorage[ref.storage]++;
    }
    console.log(`  Found ${bodyReferences.length} embedded images:`);
    for (const [storage, count] of Object.entries(bodyByStorage)) {
      console.log(`    • ${storage}: ${count}`);
    }

    if (bodySupabaseRefs.length > 0) {
      console.log(`\n  ⚠️  ${bodySupabaseRefs.length} body images still reference Supabase Storage!`);
      console.log(`  These are NOT caught by migrate-to-r2 (which only updates image_url columns).`);
      const byTable = {};
      for (const ref of bodySupabaseRefs) {
        if (!byTable[ref.table]) byTable[ref.table] = [];
        byTable[ref.table].push(ref);
      }
      for (const [table, refs] of Object.entries(byTable)) {
        console.log(`\n    📋 ${table} (${refs.length} refs):`);
        for (const ref of refs.slice(0, 5)) {
          console.log(`      • id: ${ref.id}`);
          console.log(`        ${ref.url.substring(0, 100)}${ref.url.length > 100 ? '...' : ''}`);
        }
        if (refs.length > 5) console.log(`      ... and ${refs.length - 5} more`);
      }
    }
  }

  // Shared URLs
  console.log("\n\n🔵 SHARED URLS: Same image used by multiple DB records");
  console.log("─────────────────────────────────────────────────");
  if (sharedUrls.length === 0) {
    console.log("  ✅ No shared URLs detected.");
  } else {
    console.log(`  ℹ️  ${sharedUrls.length} URLs shared across multiple records:`);
    for (const [url, refs] of sharedUrls.slice(0, 10)) {
      console.log(`    • ${url.length > 80 ? url.substring(0, 80) + '...' : url}`);
      for (const r of refs) {
        console.log(`      ↳ ${r}`);
      }
    }
    if (sharedUrls.length > 10) console.log(`    ... and ${sharedUrls.length - 10} more`);
    console.log(`\n  ℹ️  This is normal. deleteMediaWithSafety() checks references before deletion.`);
  }

  // ── Actionable recommendations ──────────────────────────
  console.log("\n\n═══════════════════════════════════════════════════════════");
  console.log("🚀 RECOMMENDED ACTIONS");
  console.log("═══════════════════════════════════════════════════════════\n");

  let step = 1;
  if (staleSupabaseRefs.length > 0) {
    console.log(`  ${step}. MIGRATE ${staleSupabaseRefs.length} DB records from Supabase → R2 URLs`);
    console.log(`     Run: supabase functions invoke migrate-to-r2`);
    console.log(`     Or:  Set R2 env vars + node scripts/migrate-to-r2.mjs (DRY_RUN=false)`);
    step++;
  }
  if (potentialDuplicates.length > 0) {
    console.log(`  ${step}. DELETE ${potentialDuplicates.length} duplicate files from Supabase Storage`);
    console.log(`     (R2 copies already serve these — Supabase copies waste quota)`);
    step++;
  }
  if (orphanedSupabase.length > 0) {
    console.log(`  ${step}. CLEANUP ${orphanedSupabase.length} orphaned Supabase Storage files`);
    console.log(`     Run: supabase functions invoke cleanup-storage`);
    step++;
  }
  if (bodySupabaseRefs.length > 0) {
    console.log(`  ${step}. UPDATE article/recipe body HTML to replace Supabase image URLs with R2`);
    console.log(`     (migrate-to-r2 only updates image_url columns, not body HTML content)`);
    step++;
  }
  if (step === 1) {
    console.log("  ✅ Everything looks clean! No action needed.\n");
  }

  // ── Write JSON report ──────────────────────────────────
  const reportPath = path.resolve(process.cwd(), "scripts", "audit-report.json");
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      dbImageRefsColumns: dbReferences.length,
      dbImageRefsBody: bodyReferences.length,
      supabaseStorageFiles: supabaseStorageKeys.size,
      urlsPointingToSupabase: supabaseUrlRefs.length,
      urlsPointingToR2: r2UrlRefs.length,
      urlsExternal: externalRefs.length,
    },
    findings: {
      potentialDuplicatesInBothStorages: potentialDuplicates,
      staleSupabaseDbRefs: staleSupabaseRefs.map(r => ({
        table: r.table, column: r.column, id: r.id,
        currentUrl: r.url,
        suggestedR2Url: r.key ? `https://${R2_CUSTOM_DOMAIN}/${r.key}` : null,
      })),
      orphanedSupabaseFiles: orphanedSupabase,
      bodySupabaseRefs: bodySupabaseRefs.map(r => ({
        table: r.table, id: r.id, url: r.url,
        suggestedR2Url: r.key ? `https://${R2_CUSTOM_DOMAIN}/${r.key}` : null,
      })),
      sharedUrls: sharedUrls.map(([url, refs]) => ({ url, usedBy: refs })),
    },
    allSupabaseStorageFiles: [...supabaseStorageKeys].sort(),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n📄 Full JSON report saved to: ${reportPath}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
