import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a file to the specified path in the Supabase "media" bucket.
 * Automatically handles generating a unique filename and upserting.
 */
export async function uploadMedia(file: File, folderId?: string): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folderId ? `${folderId}/${fileName}` : fileName;

    const { error } = await supabase.storage.from("media").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
       console.error("Storage upload error:", error);
       return null;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return null;
  }
}
