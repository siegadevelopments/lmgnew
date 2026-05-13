const url = "https://usrtaxvjwidfxajbjlpj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzMxOTcsImV4cCI6MjA5MjM0OTE5N30.hP8PizGouCbfUEw6vphbrxATPs0ukX9pX3pcUoYN3qY";

async function merge() {
  const res = await fetch(`${url}/galleries?select=*`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  const galleries = await res.json();
  
  const groups = {};
  galleries.forEach(g => {
    const key = `${g.title.toLowerCase().trim()}|${g.category}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(g);
  });

  for (const [key, list] of Object.entries(groups)) {
    if (list.length > 1) {
      console.log(`Merging ${key}...`);
      const main = list[0];
      const others = list.slice(1);
      
      for (const other of others) {
        console.log(`  Updating items from ${other.id} to ${main.id}`);
        // Update gallery_items
        const updateRes = await fetch(`${url}/gallery_items?gallery_id=eq.${other.id}`, {
          method: 'PATCH',
          headers: { 
            "apikey": key, 
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ gallery_id: main.id })
        });
        
        if (updateRes.ok) {
          console.log(`  Deleting empty gallery ${other.id}`);
          const delRes = await fetch(`${url}/galleries?id=eq.${other.id}`, {
            method: 'DELETE',
            headers: { "apikey": key, "Authorization": `Bearer ${key}` }
          });
          if (!delRes.ok) {
            console.error(`  Failed to delete ${other.id}:`, await delRes.text());
          }
        } else {
          console.error(`  Failed to update items for ${other.id}:`, await updateRes.text());
        }
      }
    }
  }
  console.log('Merge complete.');
}

merge();
