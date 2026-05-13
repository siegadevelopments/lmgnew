const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDuplicates() {
  const { data, error } = await supabase
    .from('galleries')
    .select('title, category');
  
  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  data.forEach(g => {
    const key = `${g.title.toLowerCase()}|${g.category}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
  console.log('Duplicates:', duplicates);
}

checkDuplicates();
