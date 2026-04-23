import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function downloadAndUploadImage(url: string, path: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null;
  if (!url.includes("lifestylemedicinegateway.com/wp-content/uploads")) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const { data, error } = await supabase.storage.from("media").upload(path, arrayBuffer, {
      contentType: res.headers.get("content-type") || "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.error("Upload error for", url, error.message);
      return url; // Fallback to original
    }

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error("Failed to migrate", url, err.message);
    return url;
  }
}

async function run() {
  console.log("Creating/verifying media bucket...");
  await supabase.storage.createBucket("media", { public: true }).catch(() => {});

  // Migrate Products
  console.log("Fetching products...");
  const { data: products } = await supabase.from("products").select("id, image_url");
  if (products) {
    for (const p of products) {
      if (p.image_url && p.image_url.includes("wp-content/uploads")) {
        console.log(`Migrating product ${p.id} image...`);
        const ext = p.image_url.split('.').pop() || 'jpg';
        const newUrl = await downloadAndUploadImage(p.image_url, `products/${p.id}.${ext}`);
        if (newUrl !== p.image_url) {
          await supabase.from("products").update({ image_url: newUrl }).eq("id", p.id);
        }
      }
    }
  }

  // Migrate Articles
  console.log("Fetching articles...");
  const { data: articles } = await supabase.from("articles").select("id, image_url");
  if (articles) {
    for (const a of articles) {
      if (a.image_url && a.image_url.includes("wp-content/uploads")) {
        console.log(`Migrating article ${a.id} image...`);
        const ext = a.image_url.split('.').pop() || 'jpg';
        const newUrl = await downloadAndUploadImage(a.image_url, `articles/${a.id}.${ext}`);
        if (newUrl !== a.image_url) {
          await supabase.from("articles").update({ image_url: newUrl }).eq("id", a.id);
        }
      }
    }
  }

  // Migrate Recipes
  console.log("Fetching recipes...");
  const { data: recipes } = await supabase.from("recipes").select("id, image_url");
  if (recipes) {
    for (const r of recipes) {
      if (r.image_url && r.image_url.includes("wp-content/uploads")) {
        console.log(`Migrating recipe ${r.id} image...`);
        const ext = r.image_url.split('.').pop() || 'jpg';
        const newUrl = await downloadAndUploadImage(r.image_url, `recipes/${r.id}.${ext}`);
        if (newUrl !== r.image_url) {
          await supabase.from("recipes").update({ image_url: newUrl }).eq("id", r.id);
        }
      }
    }
  }

  // Migrate Vendor Profiles
  console.log("Fetching vendor profiles...");
  const { data: vendors } = await supabase.from("vendor_profiles").select("id, store_logo_url, store_banner_url");
  if (vendors) {
    for (const v of vendors) {
      if (v.store_logo_url && v.store_logo_url.includes("wp-content/uploads")) {
        console.log(`Migrating vendor ${v.id} logo...`);
        const ext = v.store_logo_url.split('.').pop() || 'jpg';
        const newUrl = await downloadAndUploadImage(v.store_logo_url, `vendors/${v.id}_logo.${ext}`);
        if (newUrl !== v.store_logo_url) {
          await supabase.from("vendor_profiles").update({ store_logo_url: newUrl }).eq("id", v.id);
        }
      }
    }
  }

  console.log("Media Migration Complete! 🎉");
}

run().catch(console.error);
