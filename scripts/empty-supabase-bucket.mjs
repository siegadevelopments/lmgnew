import { createClient } from "@supabase/supabase-js";
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  // Ignore
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN !== "false"; 

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const bucketName = "media";

  console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
  console.log(`Target Bucket: ${bucketName}`);
  console.log(`Dry-run mode: ${DRY_RUN ? "ENABLED (Nothing will be deleted)" : "DISABLED (FILES WILL BE DELETED)"}`);

  async function deleteAllFilesInFolder(folderPath) {
    const { data: list, error } = await supabase.storage.from(bucketName).list(folderPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error(`Error listing folder ${folderPath}:`, error.message);
      return 0;
    }

    if (!list || list.length === 0) return 0;

    let deletedCount = 0;

    // Filter out directories (which have a null id or metadata) and files
    const filesToRemove = list.filter(x => x.id).map(x => folderPath ? `${folderPath}/${x.name}` : x.name);
    const subfolders = list.filter(x => !x.id);

    if (filesToRemove.length > 0) {
      console.log(`Found ${filesToRemove.length} files in ${folderPath || 'root'}.`);
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would delete ${filesToRemove.length} files.`);
        deletedCount += filesToRemove.length;
      } else {
        console.log(`  Deleting ${filesToRemove.length} files...`);
        const { error: removeError } = await supabase.storage.from(bucketName).remove(filesToRemove);
        if (removeError) {
          console.error(`  Error deleting files:`, removeError.message);
        } else {
          console.log(`  Successfully deleted ${filesToRemove.length} files.`);
          deletedCount += filesToRemove.length;
        }
      }
    }

    // Recursively process subfolders
    for (const subfolder of subfolders) {
      // Supabase list returns a placeholder file ".emptyFolderPlaceholder" sometimes, just check name
      if (subfolder.name !== ".emptyFolderPlaceholder") {
        const subfolderPath = folderPath ? `${folderPath}/${subfolder.name}` : subfolder.name;
        deletedCount += await deleteAllFilesInFolder(subfolderPath);
      }
    }

    return deletedCount;
  }

  console.log(`\nScanning and deleting files in "${bucketName}" bucket...`);
  const totalDeleted = await deleteAllFilesInFolder("");
  
  console.log(`\nCleanup complete! Total files processed: ${totalDeleted}`);
  if (DRY_RUN) {
    console.log("Run again with DRY_RUN=\"false\" in your .env.local to actually delete the files.");
  }
}

main().catch(console.error);
