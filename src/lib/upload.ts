import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_MB = 50;

/**
 * Uploads a file to either Supabase Storage or Cloudflare R2.
 * R2 is preferred for videos and large files.
 */
export async function uploadMedia(file: File, folderId?: string, bucket: string = "media"): Promise<string | null> {
  const fileMB = file.size / 1024 / 1024;
  const isVideo = file.type.startsWith("video/");
  
  // Use R2 for videos or files > 45MB (to stay safe under 50MB Supabase limit)
  if (isVideo || fileMB > 45 || bucket === "r2") {
    console.log(`Routing ${file.name} to Cloudflare R2...`);
    try {
      const fileExt = file.name.split(".").pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
      const fileName = folderId ? `${folderId}/${Date.now()}_${safeName}` : `${Date.now()}_${safeName}`;

      // 1. Get signed URL from our Edge Function
      const { data, error: funcError } = await supabase.functions.invoke("get-r2-upload-url", {
        body: { fileName, contentType: file.type }
      });

      if (funcError || !data.uploadUrl) {
        throw new Error(funcError?.message || "Failed to get R2 upload URL. Ensure secrets are set.");
      }

      // 2. Upload directly to R2
      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed with status: ${uploadResponse.status}`);
      }

      return data.publicUrl;
    } catch (err: any) {
      console.error("R2 Upload Error:", err);
      // Fallback to Supabase if R2 fails and file is small enough
      if (fileMB > 45) throw err;
      console.warn("R2 failed, falling back to Supabase...");
    }
  }

  // Standard Supabase Upload
  const fileExt = file.name.split(".").pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = folderId ? `${folderId}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket === "r2" ? "media" : bucket).upload(filePath, file, {
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
