import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkArticle() {
  console.log("Checking for 'Fight or Flight' article...");
  
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .or("title.ilike.%fight or flight%,slug.ilike.%fight-or-flight%");

  if (error) {
    console.error("Error fetching article:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No article found matching 'Fight or Flight'.");
    
    // List all articles to see what's there
    const { data: allArticles } = await supabase.from("articles").select("title, slug, status").limit(10);
    console.log("Recent articles:", allArticles);
  } else {
    console.log("Found articles:", data.map(a => ({ id: a.id, title: a.title, slug: a.slug, status: a.status })));
  }
}

checkArticle();
