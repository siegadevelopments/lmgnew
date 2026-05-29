import { createClient } from "@supabase/supabase-js";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// Ensure environment variables are loaded (can be run with dotenv or standard env vars)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service role key to scan profiles/etc.
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzMxOTcsImV4cCI6MjA5MjM0OTE5N30.hP8PizGouCbfUEw6vphbrxATPs0ukX9pX3pcUoYN3qY";

// Cloudflare R2 Credentials
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN || "media.lifestylemedicinegateway.com";

const DRY_RUN = process.env.DRY_RUN !== "false"; // Default to dry-run safety mode

async function main() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
    console.error("Missing Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME)");
    console.log("\nTo run this script, set the following environment variables:");
    console.log("  $env:R2_ACCESS_KEY_ID = 'your-key-id'");
    console.log("  $env:R2_SECRET_ACCESS_KEY = 'your-secret-key'");
    console.log("  $env:R2_ENDPOINT = 'https://<accountid>.r2.cloudflarestorage.com'");
    console.log("  $env:R2_BUCKET_NAME = 'your-bucket-name'");
    console.log("  $env:SUPABASE_SERVICE_ROLE_KEY = 'your-supabase-service-role-key' (optional, falls back to anon key)");
    console.log("  $env:DRY_RUN = 'false' (to actually delete files instead of previewing)");
    return;
  }

  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const supabase = createClient(SUPABASE_URL, supabaseKey);

  console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
  console.log(`Dry-run mode: ${DRY_RUN ? "ENABLED (No files will be deleted)" : "DISABLED (Files will be PERMANENTLY deleted)"}`);

  // 1. Gather all active references from the database
  const targets = [
    { table: "recipes", columns: ["image_url"] },
    { table: "articles", columns: ["image_url"] },
    { table: "gallery_items", columns: ["image_url"] },
    { table: "vendor_profiles", columns: ["store_logo_url", "store_banner_url", "banner_url"] },
    { table: "products", columns: ["image_url"] },
    { table: "profiles", columns: ["avatar_url"] },
    { table: "videos", columns: ["embed_url", "thumbnail_url"] },
  ];

  const referencedKeys = new Set();

  for (const target of targets) {
    try {
      console.log(`Scanning table "${target.table}"...`);
      const { data, error } = await supabase.from(target.table).select("*");
      if (error) {
        console.warn(`  Warning: Could not read table "${target.table}":`, error.message);
        continue;
      }
      if (!data) continue;

      for (const row of data) {
        for (const col of target.columns) {
          const url = row[col];
          if (url && typeof url === "string") {
            // Extract key if it's an R2 URL
            // Format 1: Custom domain e.g. https://media.lifestylemedicinegateway.com/fileName
            // Format 2: Endpoint e.g. https://<id>.r2.cloudflarestorage.com/bucket/fileName
            let key = "";
            if (R2_CUSTOM_DOMAIN && url.includes(R2_CUSTOM_DOMAIN)) {
              key = url.split(`${R2_CUSTOM_DOMAIN}/`)[1];
            } else if (url.includes(R2_BUCKET_NAME)) {
              key = url.split(`${R2_BUCKET_NAME}/`)[1];
            } else if (url.includes("r2.cloudflarestorage.com") || url.includes("r2.dev")) {
              // Try generic extract
              const parts = url.split("/");
              key = parts.slice(4).join("/"); // Skip protocol, domain, bucket
            }

            if (key) {
              referencedKeys.add(decodeURIComponent(key));
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error processing table ${target.table}:`, err);
    }
  }

  console.log(`\nFound ${referencedKeys.size} unique referenced files in the database.`);

  // 2. Connect to Cloudflare R2 and list all objects
  console.log(`\nConnecting to Cloudflare R2 bucket "${R2_BUCKET_NAME}"...`);
  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const allR2Keys = [];
  let continuationToken = undefined;
  let hasMore = true;

  while (hasMore) {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          allR2Keys.push(obj.Key);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
    hasMore = response.IsTruncated || false;
  }

  console.log(`Found total of ${allR2Keys.length} files in R2 storage.`);

  // 3. Find orphaned files (in R2 but not in database)
  const orphanedKeys = [];
  for (const key of allR2Keys) {
    if (!referencedKeys.has(key)) {
      orphanedKeys.push(key);
    }
  }

  console.log(`Identified ${orphanedKeys.length} orphaned/unused files in R2.`);

  if (orphanedKeys.length === 0) {
    console.log("No cleanup needed! All R2 assets are referenced in the database.");
    return;
  }

  // Preview orphaned files
  console.log("\n=== ORPHANED FILES PREVIEW (first 50) ===");
  orphanedKeys.slice(0, 50).forEach((key, index) => {
    console.log(`  [${index + 1}] ${key}`);
  });
  if (orphanedKeys.length > 50) {
    console.log(`  ... and ${orphanedKeys.length - 50} more files`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No files were deleted. To perform deletion, set DRY_RUN=false.");
    return;
  }

  // 4. Delete orphaned files in batches of 1000 (S3 limit)
  console.log(`\nDeleting ${orphanedKeys.length} files from R2...`);
  const batchSize = 1000;
  let deletedCount = 0;

  for (let i = 0; i < orphanedKeys.length; i += batchSize) {
    const batch = orphanedKeys.slice(i, i + batchSize);
    const objectsToDelete = batch.map(key => ({ Key: key }));

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });

    try {
      await s3Client.send(deleteCommand);
      deletedCount += batch.length;
      console.log(`  Deleted batch of ${batch.length} files (${deletedCount}/${orphanedKeys.length})...`);
    } catch (err) {
      console.error("  Error deleting batch:", err.message);
    }
  }

  console.log(`\nSuccessfully deleted total of ${deletedCount} unused files from Cloudflare R2 bucket.`);
}

main().catch(console.error);
