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

async function inspectTable() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample data:', JSON.stringify(data, null, 2));
    
    const fight = data.find(a => a.title.includes('Fight or Flight'));
    if (fight) console.log('Fight article ID is:', fight.id);
  }
}
inspectTable();
