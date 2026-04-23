import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import sharp from "sharp";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function downloadAndUploadImage(url: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();

    const optimizedBuffer = await sharp(Buffer.from(arrayBuffer))
      .webp({ quality: 80 })
      .toBuffer();

    const { data, error } = await supabase.storage.from("media").upload(path, optimizedBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

    if (error) return null;

    const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Upload error for", url, err);
    return null;
  }
}

async function scrapeGalleries(baseUrl: string, category: "memes" | "charts") {
  console.log(`\nScraping ${category} from ${baseUrl}...`);
  const res = await fetch(baseUrl);
  const html = await res.text();

  const albumRegex = /<a[^>]+href="(?:https?:\/\/[^\/]+)?([^"]+album_gallery_id_[^"]+)"|<a[^>]+href='(?:https?:\/\/[^\/]+)?([^']+album_gallery_id_[^']+)'/g;
  
  const albums: { url: string, title: string }[] = [];
  let match;
  while ((match = albumRegex.exec(html)) !== null) {
      const capturedUrl = match[1] || match[2];
      if (!capturedUrl) continue;
      
      const fullUrl = capturedUrl.startsWith('http') ? capturedUrl : `https://lifestylemedicinegateway.com${capturedUrl}`;
      const url = fullUrl.replace(/&#038;/g, '&');
      
      const snippet = html.substring(match.index, match.index + 500);
      const titleMatch = snippet.match(/data-title="([^"]+)"/);
      let title = titleMatch ? titleMatch[1].trim() : `Album ${albums.length + 1}`;

      // Remove duplicates
      if (!albums.find(a => a.url === url)) {
          albums.push({ url: url, title: title });
      }
  }

  console.log(`Found ${albums.length} albums!`);

  for (const album of albums) {
    console.log(`Processing album: ${album.title}...`);
    
    // Create DB Gallery
    const { data: gallery, error: galErr } = await supabase.from("galleries").insert({
      title: album.title,
      category: category
    }).select().single();

    if (galErr || !gallery) {
      console.error("Failed to create gallery:", galErr?.message);
      continue;
    }

    const albumRes = await fetch(album.url);
    const albumHtml = await albumRes.text();
    
    // Find all thumbnails within the gallery container area
    // Usually the gallery uses 'bwg_container'
    const imgRegex = /data-src="([^"]+)"/g;
    const images: string[] = [];
    let imgMatch;
    
    while ((imgMatch = imgRegex.exec(albumHtml)) !== null) {
        let src = imgMatch[1];
        if (src.includes("?bwg=")) src = src.split("?bwg=")[0];
        
        // FILTER: Skip non-image extensions
        if (!/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(src)) {
          continue;
        }

        // FILTER: Skip logos and obvious placeholders
        const lowercaseSrc = src.toLowerCase();
        if (
          lowercaseSrc.includes("logo") || 
          lowercaseSrc.includes("search-products") || 
          lowercaseSrc.includes("become-a-preferred-customer") ||
          lowercaseSrc.includes("cropped-") ||
          lowercaseSrc.includes("150x150") || // skip small thumbs if possible
          lowercaseSrc.includes("-40x52")
        ) {
          continue;
        }

        // Convert thumb url to full url
        // https://.../wp-content/uploads/photo-gallery/thumb/IMG_3931.jpg =>
        // https://.../wp-content/uploads/photo-gallery/IMG_3931.jpg
        const fullSrc = src.replace("/thumb/", "/");
        if (!images.includes(fullSrc)) {
            images.push(fullSrc);
        }
    }

    if (images.length === 0) {
      console.log(`No valid images found in album: ${album.title}`);
      continue;
    }

    console.log(`Found ${images.length} valid images in ${album.title}. Uploading...`);
    
    for (let i = 0; i < images.length; i++) {
        const fullSrc = images[i];
        const filename = fullSrc.split('/').pop() || `img_${i}`;
        const cleanFilename = filename.split('.')[0];
        const path = `galleries_optimized/${category}/${gallery.id}/${cleanFilename}.webp`;
        
        const uploadedUrl = await downloadAndUploadImage(fullSrc, path);
        if (uploadedUrl) {
            await supabase.from("gallery_items").insert({
               gallery_id: gallery.id,
               image_url: uploadedUrl
            });
        }
    }
  }
}

async function run() {
  console.log("Cleaning up old galleries and items...");
  await supabase.from("gallery_items").delete().not("id", "is", null);
  await supabase.from("galleries").delete().not("id", "is", null);

  // Migrate Memes (9 pages)
  for (let i = 1; i <= 9; i++) {
    await scrapeGalleries(`https://lifestylemedicinegateway.com/memes/?page_number_0=${i}`, "memes");
  }

  // Migrate Charts (6 pages)
  for (let i = 1; i <= 6; i++) {
    await scrapeGalleries(`https://lifestylemedicinegateway.com/charts/?page_number_0=${i}`, "charts");
  }

  console.log("Migration completely finished!");
}

run().catch(console.error);
