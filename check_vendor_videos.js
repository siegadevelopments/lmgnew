
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVendorVideos(vendorId) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('author_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log(`Total videos for vendor ${vendorId}: ${data.length}`);
  data.forEach(v => {
    console.log(`- [${v.status}] ${v.title} (URL: ${v.embed_url})`);
  });
}

checkVendorVideos('752c8795-552a-4a39-8429-63ea0ef118a8');
