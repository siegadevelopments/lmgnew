// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Run clean up asynchronously to prevent timeouts
    runCleanup(supabaseAdmin)
      .then((count) => console.log(`Asynchronous storage cleanup finished! Total deleted orphaned files: ${count}`))
      .catch((err) => console.error("Asynchronous storage cleanup failed:", err.message));

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Orphaned storage cleanup triggered successfully in the background! It will scan all database tables and safely purge all unused files from Supabase Storage." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 202,
    });

  } catch (error: any) {
    console.error("Cleanup Trigger Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function listAllStorageFiles(supabaseAdmin: any, bucketName: string, path = ""): Promise<string[]> {
  const allPaths: string[] = [];
  const { data: items, error } = await supabaseAdmin.storage
    .from(bucketName)
    .list(path, { limit: 150 });

  if (error) {
    console.error(`Error listing folder "${path}":`, error.message);
    return [];
  }

  if (!items) return [];

  for (const item of items) {
    const itemPath = path ? `${path}/${item.name}` : item.name;
    // Deno/Supabase list returns folders without metadata or id
    if (item.metadata || item.id) {
      allPaths.push(itemPath);
    } else {
      const subPaths = await listAllStorageFiles(supabaseAdmin, bucketName, itemPath);
      allPaths.push(...subPaths);
    }
  }

  return allPaths;
}

async function runCleanup(supabaseAdmin: any): Promise<number> {
  console.log("Starting Supabase Storage Garbage Collection...");

  // 1. Get all active files in Supabase Storage media bucket
  const allStorageFiles = await listAllStorageFiles(supabaseAdmin, "media");
  console.log(`Found total of ${allStorageFiles.length} files in Supabase Storage.`);

  if (allStorageFiles.length === 0) return 0;

  // 2. Scan all tables to build a Set of referenced files
  const referencedPaths = new Set<string>();

  const targets = [
    { table: "recipes", columns: ["image_url"] },
    { table: "articles", columns: ["image_url"] },
    { table: "gallery_items", columns: ["image_url"] },
    { table: "vendor_profiles", columns: ["store_logo_url", "banner_url"] },
    { table: "products", columns: ["image_url"] },
    { table: "services", columns: ["image_url"] },
  ];

  for (const target of targets) {
    try {
      const { data: rows, error } = await supabaseAdmin
        .from(target.table)
        .select("*");

      if (error || !rows) continue;

      for (const row of rows) {
        for (const col of target.columns) {
          const url = row[col];
          if (url && typeof url === "string") {
            if (url.includes("/storage/v1/object/public/media/")) {
              const parts = url.split("/storage/v1/object/public/media/");
              if (parts.length >= 2 && parts[1]) {
                referencedPaths.add(parts[1]);
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error(`Error scanning table "${target.table}" during GC:`, e.message);
    }
  }

  console.log(`Database references ${referencedPaths.size} unique files in storage.`);

  // 3. Find files in storage that are NOT referenced in the database
  let deletedCount = 0;
  const toDelete: string[] = [];

  for (const file of allStorageFiles) {
    if (!referencedPaths.has(file)) {
      toDelete.push(file);
    }
  }

  console.log(`Found ${toDelete.length} orphaned/unused files to delete.`);

  // 4. Delete orphaned files in batches
  if (toDelete.length > 0) {
    const batchSize = 20;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      console.log(`Deleting batch:`, batch);
      const { error: removeError } = await supabaseAdmin.storage
        .from("media")
        .remove(batch);

      if (removeError) {
        console.error("Failed to delete batch:", removeError.message);
      } else {
        deletedCount += batch.length;
      }
    }
  }

  console.log(`Purged total of ${deletedCount} unused files from Supabase Storage.`);
  return deletedCount;
}
