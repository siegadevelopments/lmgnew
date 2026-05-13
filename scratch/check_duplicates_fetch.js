const url = "https://usrtaxvjwidfxajbjlpj.supabase.co/rest/v1/galleries?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzMxOTcsImV4cCI6MjA5MjM0OTE5N30.hP8PizGouCbfUEw6vphbrxATPs0ukX9pX3pcUoYN3qY";

async function check() {
  const res = await fetch(url, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  const data = await res.json();
  
  const counts = {};
  data.forEach(g => {
    const key = `${g.title.toLowerCase().trim()}|${g.category}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
  console.log('Galleries:', data.length);
  console.log('Duplicates:', duplicates);
  
  // Show some memes galleries
  console.log('Meme Galleries:', data.filter(g => g.category === 'memes').map(g => g.title));
}

check();
