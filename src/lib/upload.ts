import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_MB = 50;

/**
 * Uploads a file to the specified path in the Supabase "media" bucket.
 * Returns the public URL on success, or null on failure.
 * Throws a descriptive Error so callers can show a useful toast message.
 */
export async function uploadMedia(file: File, folderId?: string, bucket: string = "media"): Promise<string | null> {
  // Guard: warn on large files (Supabase free tier: 50 MB per file)
  const fileMB = file.size / 1024 / 1024;
  if (fileMB > MAX_FILE_MB) {
    throw new Error(
      `File "${file.name}" is ${fileMB.toFixed(1)} MB — exceeds the ${MAX_FILE_MB} MB limit. Please compress the video first.`
    );
  }

  const fileExt = file.name.split(".").pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = folderId ? `${folderId}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(error.message || "Storage upload failed");
  }

  const { data } = supabase.storage.from("media").getPublicUrl(filePath);
  return data.publicUrl;
}
