fetch("https://usrtaxvjwidfxajbjlpj.supabase.co/functions/v1/generate-ai-content", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "article", title: "Benefits of Turmeric" })
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(data => console.log(data))
.catch(err => console.error(err));
