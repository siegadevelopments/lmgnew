const url = "https://lifestylemedicinegateway.com/memes/";

async function testScrape() {
  const res = await fetch(url);
  const html = await res.text();
  
  // Try to find albums
  const albumRegex = /<a[^>]+href="(?:https?:\/\/[^\/]+)?([^"]+album_gallery_id_[^"]+)"|<a[^>]+href='(?:https?:\/\/[^\/]+)?([^']+album_gallery_id_[^']+)'/g;
  
  const albums: { url: string, title: string, roughHTML: string }[] = [];
  let match;
  while ((match = albumRegex.exec(html)) !== null) {
      const capturedUrl = match[1] || match[2];
      if (!capturedUrl) continue;
      
      const snippet = html.substring(match.index, match.index + 500);
      albums.push({ url: capturedUrl, title: '', roughHTML: snippet });
  }

  console.log("Found albums:", albums.length);
  if (albums.length > 0) {
      console.log("Sample 1 snippet:");
      console.log(albums[0].roughHTML);
  }
}

testScrape().catch(console.error);
