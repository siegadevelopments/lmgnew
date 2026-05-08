import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkSchema() {
  // Check articles columns
  const { data: article, error: articleErr } = await supabase
    .from('articles')
    .select('*')
    .limit(1)
    .single();

  console.log('--- ARTICLES COLUMNS ---');
  if (article) console.log(Object.keys(article));
  else console.log('No articles found or error:', articleErr);

  // Check recipes columns
  const { data: recipe, error: recipeErr } = await supabase
    .from('recipes')
    .select('*')
    .limit(1)
    .single();

  console.log('--- RECIPES COLUMNS ---');
  if (recipe) console.log(Object.keys(recipe));
  else console.log('No recipes found or error:', recipeErr);
}

checkSchema();
