import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const WP_URL = "https://lifestylemedicinegateway.com/wp-json/wp/v2";

async function run() {
  console.log("Fetching WP Categories...");
  const catRes = await fetch(`${WP_URL}/categories?per_page=100`);
  const categories = await catRes.json();
  const catMap = new Map();
  categories.forEach((c: any) => catMap.set(c.id, c.name));

  console.log("Fetching WP Posts (Articles) to remap categories...");
  let page = 1;
  let totalMigrated = 0;
  
  while (true) {
    const res = await fetch(`${WP_URL}/posts?per_page=100&page=${page}`);
    if (!res.ok) break;
    const posts = await res.json();
    if (posts.length === 0) break;

    for (const post of posts) {
      if (post.categories && post.categories.length > 0) {
        // Find the main category string
        const catName = catMap.get(post.categories[0]) || "Articles";
        
        // Find the matching article in Supabase using the slug
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .eq("slug", post.slug)
          .single();
          
        if (existing) {
          await supabase.from("articles").update({ category_name: catName }).eq("id", existing.id);
          totalMigrated++;
        }
      }
    }
    page++;
  }
  console.log(`Updated categorization for ${totalMigrated} articles!`);

  console.log("Fetching plugin Videos...");
  const vidRes = await fetch(`${WP_URL}/aiovg_videos?per_page=100`);
  let totalVideos = 0;
  if (vidRes.ok) {
     const videos = await vidRes.json();
     for (const v of videos) {
        // Strip iframe out of the content, or just insert the iframe directly.
        let embed_url = "";
        let thumbnail_url = "";
        
        // Extract embedded iframe source
        const iframeMatch = v.content.rendered.match(/src="([^"]+)"/);
        if (iframeMatch) embed_url = iframeMatch[1];
        
        // Try to get thumbnail (if any)
        if (v._links && v._links["wp:featuredmedia"]) {
          const mediaRes = await fetch(v._links["wp:featuredmedia"][0].href);
          if (mediaRes.ok) {
             const media = await mediaRes.json();
             thumbnail_url = media.source_url;
          }
        }

        // Use standard embed if the plugin hid it
        if (!embed_url && v.link) embed_url = v.link;

        await supabase.from("videos").insert({
           title: v.title.rendered,
           description: v.excerpt?.rendered || "",
           embed_url: embed_url,
           thumbnail_url: thumbnail_url
        });
        totalVideos++;
     }
  }
  console.log(`Migrated ${totalVideos} Videos!`);
}

run().catch(console.error);
