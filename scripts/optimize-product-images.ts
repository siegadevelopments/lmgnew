import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Strip WordPress size suffixes like -150x150 or -300x277 from URLs to get the original high-res image
function getHighResUrl(url: string): string {
  if (!url) return url;
  // matches e.g. -150x150.png, -1024x768.jpeg
  return url.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/, "$1");
}

async function downloadAndUploadImage(url: string, path: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Failed to fetch image", url, "Status:", res.status);
      return url;
    }
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const { data, error } = await supabase.storage.from("media").upload(path, arrayBuffer, {
      contentType: res.headers.get("content-type") || "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.error("Upload error for", url, error.message);
      return url; 
    }

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error("Failed to migrate", url, err.message);
    return url;
  }
}

async function run() {
  console.log("Fetching products with WP URLs...");
  const { data: products } = await supabase
    .from("products")
    .select("id, image_url");

  if (!products) return;

  let migratedCount = 0;

  for (const p of products) {
    if (p.image_url && p.image_url.includes("wp-content/uploads")) {
      const highResUrl = getHighResUrl(p.image_url);
      
      let ext = highResUrl.split('.').pop() || 'jpg';
      if (ext.length > 4) ext = 'jpg'; // fallback
      
      console.log(`Optimizing product ${p.id} (${highResUrl})...`);
      const newUrl = await downloadAndUploadImage(highResUrl, `products/${p.id}.${ext}`);
      
      if (newUrl && newUrl !== p.image_url) {
        await supabase.from("products").update({ image_url: newUrl }).eq("id", p.id);
        migratedCount++;
      }
    }
  }

  console.log(`Successfully optimized and migrated ${migratedCount} product images! 🎉`);
}

run().catch(console.error);
