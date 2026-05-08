import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('content')
    .eq('slug', 'fight-or-flight-—-a-simple-guide-to-calming-your-system')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- CONTENT START ---');
  console.log(data.content);
  console.log('--- CONTENT END ---');
}

checkArticle();
