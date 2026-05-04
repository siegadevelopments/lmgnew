
const SUPABASE_URL = 'https://usrtaxvjwidfxajbjlpj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y';

async function checkData() {
  const vRes = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=id,title`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const videos = await vRes.json();
  console.log("VIDEOS IN DB:", JSON.stringify(videos.slice(0, 5)));

  const aRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=id,title`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const articles = await aRes.json();
  console.log("ARTICLES IN DB:", JSON.stringify(articles.slice(0, 5)));
}

checkData();
