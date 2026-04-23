const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanup() {
  console.log("Fetching all galleries...");
  const { data: galleries } = await supabase.from('galleries').select('id, title, category');
  
  if (!galleries) return;

  const seen = new Set();
  const toDelete = [];

  for (const g of galleries) {
    const key = `${g.title}|${g.category}`;
    if (seen.has(key)) {
      toDelete.push(g.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${toDelete.length} duplicate galleries.`);

  if (toDelete.length > 0) {
    // Delete gallery items first just in case
    console.log("Deleting items for duplicate galleries...");
    await supabase.from('gallery_items').delete().in('gallery_id', toDelete);
    
    console.log("Deleting duplicate galleries...");
    const { error } = await supabase.from('galleries').delete().in('id', toDelete);
    if (error) console.error("Error deleting galleries:", error);
    else console.log("Cleanup complete!");
  }
}

cleanup();
