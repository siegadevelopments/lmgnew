const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
  }
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function findArticle() {
  console.log("Searching for articles related to 'Fight or Flight'...");
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, status')
    .or('title.ilike.%fight or flight%,slug.ilike.%fight-or-flight%');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Results:', JSON.stringify(data, null, 2));
  }
}
findArticle();
