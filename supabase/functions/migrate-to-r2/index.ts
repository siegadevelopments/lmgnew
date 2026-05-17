// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.568.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_CUSTOM_DOMAIN = Deno.env.get("R2_CUSTOM_DOMAIN");

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
      throw new Error("Missing Cloudflare R2 configuration secrets in Supabase Edge Functions environment");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    // Start migration asynchronously without waiting for it to finish!
    runMigration(supabaseAdmin, s3Client, R2_BUCKET_NAME, R2_ENDPOINT, R2_CUSTOM_DOMAIN)
      .then((count) => console.log(`Asynchronous R2 migration finished! Total migrated assets: ${count}`))
      .catch((err) => console.error("Asynchronous R2 migration failed:", err.message));

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Media asset migration to Cloudflare R2 triggered successfully in the background! It will run to completion in the cloud and reclaim your Supabase Storage quota shortly." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 202,
    });

  } catch (error: any) {
    console.error("Migration Trigger Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function runMigration(supabaseAdmin: any, s3Client: any, R2_BUCKET_NAME: string, R2_ENDPOINT: string, R2_CUSTOM_DOMAIN?: string): Promise<number> {
  const migrationTargets = [
    { table: "recipes", columns: ["image_url"] },
    { table: "articles", columns: ["image_url"] },
    { table: "gallery_items", columns: ["image_url"] },
    { table: "vendor_profiles", columns: ["store_logo_url", "banner_url"] },
    { table: "products", columns: ["image_url"] },
    { table: "services", columns: ["image_url"] },
  ];

  let migratedCount = 0;

  for (const target of migrationTargets) {
    try {
      console.log(`Scanning table "${target.table}"...`);
      const { data: rows, error } = await supabaseAdmin
        .from(target.table)
        .select("*");

      if (error) {
        console.log(`Skipping table "${target.table}" (or no access):`, error.message);
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
              console.log(`Migrating "${filePath}" from table "${target.table}"...`);

              // 1. Download from Supabase
              const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from("media")
                .download(filePath);

              if (downloadError) {
                console.error(`  Failed to download "${filePath}":`, downloadError.message);
                continue;
              }

              // 2. Upload to Cloudflare R2
              const arrayBuffer = await fileData.arrayBuffer();
              const uploadCommand = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: filePath,
                Body: new Uint8Array(arrayBuffer),
                ContentType: fileData.type || "image/jpeg",
              });

              await s3Client.send(uploadCommand);

              // 3. Construct new public R2 URL
              const r2Url = R2_CUSTOM_DOMAIN
                ? `https://${R2_CUSTOM_DOMAIN}/${filePath}`
                : `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${filePath}`;

              // 4. Update the database record
              const updatePayload: Record<string, any> = {};
              updatePayload[col] = r2Url;

              const query = supabaseAdmin.from(target.table).update(updatePayload);
              if (row.id) {
                query.eq("id", row.id);
              } else if (row.slug) {
                query.eq("slug", row.slug);
              } else {
                continue;
              }

              const { error: updateError } = await query;
              if (updateError) {
                console.error(`  Failed to update DB for "${filePath}":`, updateError.message);
                continue;
              }

              console.log(`  Successfully updated DB to R2: ${r2Url}`);

              // 5. Delete from Supabase Storage
              const { error: removeError } = await supabaseAdmin.storage
                .from("media")
                .remove([filePath]);

              if (removeError) {
                console.warn(`  Warning: Failed to delete "${filePath}" from Supabase:`, removeError.message);
              } else {
                console.log(`  Successfully deleted "${filePath}" from Supabase Storage.`);
              }

              migratedCount++;
            } catch (itemErr: any) {
              console.error(`  Error processing item "${filePath}":`, itemErr.message);
            }
          }
        }
      }
    } catch (tableErr: any) {
      console.error(`Error processing table "${target.table}":`, tableErr.message);
    }
  }

  return migratedCount;
}
