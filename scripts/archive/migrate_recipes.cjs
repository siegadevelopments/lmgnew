const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VENDOR_ID = "f575958c-804b-4a51-ba44-a923275fe53d"; // Daniella Hogarth

async function migrate() {
  const recipes = JSON.parse(fs.readFileSync('scripts/daniella_recipes.json', 'utf8'));

  console.log(`Starting migration of ${recipes.length} recipes for Daniella Hogarth...`);

  const toInsert = recipes.map(r => {
    return {
      author_id: VENDOR_ID,
      title: r.title,
      slug: r.slug + "-" + Math.floor(Math.random() * 1000),
      excerpt: r.excerpt,
      content: r.content,
      image_url: r.image_url,
      prep_time: r.prep_time,
      cook_time: r.cook_time
    };
  });

  const { data, error } = await supabase
    .from('recipes')
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Migration error:", error.message);
  } else {
    console.log(`Successfully migrated ${data.length} recipes for Daniella Hogarth.`);
  }
}

migrate();
