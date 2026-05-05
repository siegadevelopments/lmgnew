import fs from "fs";

async function fetchArticles() {
  try {
    const response = await fetch(
      "https://lifestylemedicinegateway.com/wp-json/wp/v2/posts?per_page=100&_embed",
    );
    const posts = await response.json();

    const articles = posts.map((post) => ({
      title: post.title.rendered,
      content: post.content.rendered,
      excerpt: post.excerpt?.rendered || null,
      slug: post.slug,
      image_url: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
      link: post.link,
    }));

    fs.writeFileSync(
      "d:\\antigravity\\lmgnew\\scratch\\articles_data.json",
      JSON.stringify(articles),
      "utf8",
    );
    console.log(`Saved ${articles.length} articles to articles_data.json`);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

fetchArticles();
