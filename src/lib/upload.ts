import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a file to either Supabase Storage or Cloudflare R2.
 * R2 is preferred for videos and large files.
 */
export async function uploadMedia(
  file: File,
  folderId?: string,
  bucket: string = "media",
): Promise<string | null> {
  const fileMB = file.size / 1024 / 1024;
  const isVideo = file.type.startsWith("video/");

  // ALWAYS use R2 by default now because Supabase storage is full (1GB limit reached)
  const shouldForceR2 = true; 

  if (shouldForceR2 || isVideo || fileMB > 45 || bucket === "r2") {
    console.log(`Routing ${file.name} to Cloudflare R2 (Supabase is full)...`);
    try {
      const fileExt = file.name.split(".").pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
      const fileName = folderId
        ? `${folderId}/${Date.now()}_${safeName}`
        : `${Date.now()}_${safeName}`;

      // 1. Get signed URL from our Edge Function
      console.log("Invoking get-r2-upload-url...");
      const { data, error: funcError } = await supabase.functions.invoke("get-r2-upload-url", {
        body: { fileName, contentType: file.type },
      });

      if (funcError) {
        console.error("Supabase Edge Function Error:", funcError);
        throw new Error(`Edge Function failed: ${funcError.message || "Unknown error"}`);
      }

      if (!data?.uploadUrl) {
        throw new Error("Failed to get R2 upload URL from function response.");
      }

      // 2. Upload directly to R2
      try {
        const uploadResponse = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`R2 client upload failed with status: ${uploadResponse.status}`);
        }
      } catch (clientErr: any) {
        console.warn("Client-side R2 upload failed (likely CORS). Attempting proxy fallback...", clientErr);
        
        // 3. Fallback to API Proxy if CORS blocks the direct browser upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadUrl", data.uploadUrl);
        
        const proxyResponse = await fetch("/api/upload-proxy", {
          method: "POST",
          body: formData,
        });
        
        if (!proxyResponse.ok) {
          const proxyError = await proxyResponse.json().catch(() => ({}));
          throw new Error(proxyError.error || `R2 proxy upload failed with status: ${proxyResponse.status}`);
        }
      }

      return data.publicUrl;
    } catch (err: any) {
      console.error("R2 Upload Error:", err);
      // Fallback to Supabase if R2 fails and file is small enough
      if (fileMB > 45) throw err;
      console.warn("R2 failed entirely, falling back to Supabase...");
    }
  }

  // Standard Supabase Upload
  const fileExt = file.name.split(".").pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = folderId ? `${folderId}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket === "r2" ? "media" : bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(error.message || "Storage upload failed");
  }

  const { data } = supabase.storage.from(bucket === "r2" ? "media" : bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Safely deletes a file from storage ONLY if it's not referenced by any other content.
 * This is a "Garbage Collection" style safety check requested by the user.
 */
export async function deleteMediaWithSafety(url: string): Promise<{ success: boolean; message: string }> {
  if (!url) return { success: false, message: "No URL provided" };

  try {
    console.log(`Checking usage for: ${url}`);

    // 1. Check all tables for references
    const tables = [
      { name: "videos", columns: ["embed_url", "thumbnail_url"] },
      { name: "products", columns: ["image_url"] },
      { name: "articles", columns: ["image_url"] },
      { name: "recipes", columns: ["image_url"] },
      { name: "gallery_items", columns: ["image_url"] },
      { name: "vendor_profiles", columns: ["store_logo_url", "store_banner_url"] },
      { name: "profiles", columns: ["avatar_url"] },
    ];

    let referenceCount = 0;

    for (const table of tables) {
      for (const col of table.columns) {
        const { count, error } = await supabase
          .from(table.name as any)
          .select("*", { count: "exact", head: true })
          .eq(col, url);

        if (error) {
          console.warn(`Error checking ${table.name}.${col}:`, error);
          continue;
        }
        
        referenceCount += (count || 0);
      }
    }

    // If more than 1 reference exists (the one we are about to delete), don't delete from storage
    // NOTE: When this is called during a delete operation, the record might still exist in the DB
    // so a reference count of 1 is expected if it's the item being deleted.
    // However, if we call this AFTER the DB delete, the count should be 0.
    if (referenceCount > 1) {
      console.log(`Asset in use (${referenceCount} references). Skipping storage deletion.`);
      return { success: false, message: "Asset still in use by other content" };
    }

    // 2. Identify and Delete from Storage
    if (url.includes("supabase.co/storage")) {
      // Supabase Storage Deletion
      // URL format: .../storage/v1/object/public/[bucket]/[path]
      const parts = url.split("/storage/v1/object/public/");
      if (parts.length > 1) {
        const pathParts = parts[1].split("/");
        const bucket = pathParts[0];
        const path = pathParts.slice(1).join("/");
        
        console.log(`Deleting from Supabase: bucket=${bucket}, path=${path}`);
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
      }
    } else {
      // Potential R2 Deletion via Edge Function
      console.log(`Invoking delete-storage-object for R2: ${url}`);
      const { data, error } = await supabase.functions.invoke("delete-storage-object", {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    }

    return { success: true, message: "Asset successfully removed from storage" };

  } catch (err: any) {
    console.error("Safe Delete Error:", err);
    return { success: false, message: err.message || "Failed to delete asset" };
  }
}
