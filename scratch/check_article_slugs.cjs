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

async function checkSlugs() {
  const { data, error } = await supabase
    .from('articles')
    .select('title, slug');
  
  if (error) {
    console.error('Error:', error);
  } else {
    const weirdOnes = data.filter(a => /[^a-z0-9-]/.test(a.slug));
    console.log('Articles with non-standard slugs:', JSON.stringify(weirdOnes, null, 2));
  }
}
checkSlugs();
