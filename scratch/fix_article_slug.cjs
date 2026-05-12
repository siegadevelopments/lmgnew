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

async function fixSlug() {
  const oldSlug = "fight-or-flight-—-a-simple-guide-to-calming-your-system";
  const newSlug = "fight-or-flight-a-simple-guide-to-calming-your-system";
  
  console.log(`Updating slug from '${oldSlug}' to '${newSlug}'...`);
  
  const { data, error } = await supabase
    .from('articles')
    .update({ slug: newSlug })
    .eq('slug', oldSlug)
    .select();
  
  if (error) {
    console.error('Error updating slug:', error);
  } else {
    console.log('Update successful:', JSON.stringify(data, null, 2));
  }
}
fixSlug();
