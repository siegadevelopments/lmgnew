fetch("https://usrtaxvjwidfxajbjlpj.supabase.co/functions/v1/generate-ai-content", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    type: "grammar", 
    textsToCheck: { title: "A test tytle", content: "<p>This is a test with bad grammer.</p>" }
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
