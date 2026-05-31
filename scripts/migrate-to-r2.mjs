import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
    console.log("Loaded environment variables from .env.local");
  }
} catch (e) {
  console.log("Could not load .env.local file:", e.message);
}

// Ensure environment variables are loaded (can be run with dotenv or standard env vars)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cloudflare R2 Credentials
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_CUSTOM_DOMAIN = process.env.R2_CUSTOM_DOMAIN || "media.lifestylemedicinegateway.com";

const DRY_RUN = process.env.DRY_RUN !== "false"; // Default to dry-run safety mode

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required to read storage files and write to database tables bypassing RLS.");
    console.log("\nTo run this script, set the following environment variables:");
    console.log("  $env:SUPABASE_SERVICE_ROLE_KEY = 'your-supabase-service-role-key'");
    return;
  }
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
    console.error("Missing Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME)");
    console.log("\nTo run this script, set the following environment variables:");
    console.log("  $env:R2_ACCESS_KEY_ID = 'your-key-id'");
    console.log("  $env:R2_SECRET_ACCESS_KEY = 'your-secret-key'");
    console.log("  $env:R2_ENDPOINT = 'https://<accountid>.r2.cloudflarestorage.com'");
    console.log("  $env:R2_BUCKET_NAME = 'your-bucket-name'");
    console.log("  $env:DRY_RUN = 'false' (to actually perform migration and deletion instead of dry-run)");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
  console.log(`Dry-run mode: ${DRY_RUN ? "ENABLED (No database changes or file deletions will occur)" : "DISABLED (MIGRATION WILL OCCUR)"}`);

  const migrationTargets = [
    { table: "recipes", columns: ["image_url"] },
    { table: "articles", columns: ["image_url"] },
    { table: "gallery_items", columns: ["image_url"] },
    { table: "vendor_profiles", columns: ["store_logo_url", "store_banner_url", "banner_url"] },
    { table: "products", columns: ["image_url"] },
    { table: "services", columns: ["image_url"] },
  ];

  let migratedCount = 0;

  for (const target of migrationTargets) {
    try {
      console.log(`Scanning table "${target.table}"...`);
      const { data: rows, error } = await supabase
        .from(target.table)
        .select("*");

      if (error) {
        console.error(`  Error scanning table "${target.table}":`, error.message);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      for (const row of rows) {
        for (const col of target.columns) {
          const url = row[col];
          if (url && typeof url === "string" && url.includes("/storage/v1/object/public/media/")) {
            const parts = url.split("/storage/v1/object/public/media/");
            if (parts.length < 2) continue;
            
            const filePath = parts[1];
            if (!filePath) continue;

            try {
              console.log(`Found file to migrate: "${filePath}" from table "${target.table}" (row identifier: ${row.id || row.slug})`);

              if (DRY_RUN) {
                console.log(`  [DRY RUN] Would download "${filePath}" from Supabase, upload to R2, update DB, and delete from Supabase.`);
                migratedCount++;
                continue;
              }

              // 1. Download from Supabase
              console.log(`  Downloading "${filePath}" from Supabase Storage...`);
              const { data: fileBlob, error: downloadError } = await supabase.storage
                .from("media")
                .download(filePath);

              if (downloadError) {
                console.error(`  Failed to download "${filePath}":`, downloadError.message);
                continue;
              }

              // 2. Upload to Cloudflare R2
              const arrayBuffer = await fileBlob.arrayBuffer();
              console.log(`  Uploading "${filePath}" to Cloudflare R2...`);
              const uploadCommand = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: filePath,
                Body: Buffer.from(arrayBuffer),
                ContentType: fileBlob.type || "image/jpeg",
              });

              await s3Client.send(uploadCommand);

              // 3. Construct new public R2 URL
              const r2Url = R2_CUSTOM_DOMAIN
                ? `https://${R2_CUSTOM_DOMAIN}/${filePath}`
                : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${filePath}`;

              // 4. Update the database record
              console.log(`  Updating database record with R2 URL...`);
              const updatePayload = {};
              updatePayload[col] = r2Url;

              const query = supabase.from(target.table).update(updatePayload);
              if (row.id) {
                query.eq("id", row.id);
              } else if (row.slug) {
                query.eq("slug", row.slug);
              } else {
                console.error(`  Could not find identifier (id or slug) for row in table ${target.table}`);
                continue;
              }

              const { error: updateError } = await query;
              if (updateError) {
                console.error(`  Failed to update DB for "${filePath}":`, updateError.message);
                continue;
              }

              console.log(`  Successfully updated DB to R2 URL: ${r2Url}`);

              // 5. Delete from Supabase Storage
              console.log(`  Deleting "${filePath}" from Supabase Storage...`);
              const { error: removeError } = await supabase.storage
                .from("media")
                .remove([filePath]);

              if (removeError) {
                console.warn(`  Warning: Failed to delete "${filePath}" from Supabase:`, removeError.message);
              } else {
                console.log(`  Successfully deleted "${filePath}" from Supabase Storage.`);
              }

              migratedCount++;
            } catch (itemErr) {
              console.error(`  Error processing item "${filePath}":`, itemErr.message);
            }
          }
        }
      }
    } catch (tableErr) {
      console.error(`Error processing table "${target.table}":`, tableErr.message);
    }
  }

  console.log(`\nMigration completed! Total migrated assets: ${migratedCount}`);
}

main().catch(console.error);
