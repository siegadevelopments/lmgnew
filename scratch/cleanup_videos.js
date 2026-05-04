
const SUPABASE_URL = 'https://usrtaxvjwidfxajbjlpj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y';

async function cleanup() {
  // Find all videos that look like articles (no video extension in URL, or specific titles)
  const vRes = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=id,title,embed_url`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const videos = await vRes.json();
  
  const toDelete = videos.filter(v => {
    const isActuallyArticle = !v.embed_url || 
        (!v.embed_url.includes('youtube.com') && 
         !v.embed_url.includes('youtu.be') && 
         !v.embed_url.includes('vimeo.com') && 
         !v.embed_url.includes('.mp4') && 
         !v.embed_url.includes('mux.com'));
    return isActuallyArticle;
  });

  console.log(`Found ${toDelete.length} articles in videos table.`);

  if (toDelete.length > 0) {
    const ids = toDelete.map(v => v.id);
    // Delete them in chunks
    const chunkSize = 20;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=in.(${chunk.join(',')})`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (delRes.ok) {
        console.log(`Deleted chunk ${Math.floor(i/chunkSize) + 1}`);
      }
    }
  }
}

cleanup();
