import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";
const WP_API_URL = "https://lifestylemedicinegateway.com/wp-json/wp/v2";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helpers
const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "").trim();

const getPrice = (product: any): number => {
  if (product._updated_price) return parseFloat(product._updated_price);
  if (product.price) return parseFloat(product.price);
  return Math.round((Math.random() * 80 + 10) * 100) / 100; // Mock price if missing
};

const getImageUrl = (post: any): string | null => {
  if (post.featured_image_url) {
    const urls = Object.values(post.featured_image_url);
    if (urls.length > 0) return urls[0] as string;
  }
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url) return media.source_url;
  return null;
};

async function seed() {
  console.log("Starting Migration from WordPress to Supabase...");

  try {
    // 1. Fetch & Seed Categories
    console.log("Fetching categories...");
    const catRes = await fetch(`${WP_API_URL}/categories?per_page=100`);
    const wpCategories = await catRes.json();
    console.log(`Found ${wpCategories.length} categories.`);
    
    // Insert Articles Categories
    for (const cat of wpCategories) {
      await supabase.from("categories").upsert({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        type: "article"
      });
    }

    const prodCatRes = await fetch(`${WP_API_URL}/product_cat?per_page=100`);
    const wpProdCategories = await prodCatRes.json();
    for (const cat of wpProdCategories) {
      // Use negative ID to avoid collision with article categories if needed, or just insert as product category
      await supabase.from("categories").upsert({
        name: cat.name,
        slug: cat.slug,
        type: "product"
      });
    }
    
    // We fetch categories again to map ID by slug
    const { data: dbCategories } = await supabase.from("categories").select("*");

    // 2. Fetch & Seed Products
    console.log("Fetching products...");
    const prodRes = await fetch(`${WP_API_URL}/product?per_page=100&_embed=1`);
    const wpProducts = await prodRes.json();
    console.log(`Found ${wpProducts.length} products.`);

    const productsToInsert = wpProducts.map((prod: any) => ({
      id: prod.id,
      title: prod.title.rendered,
      slug: prod.slug,
      excerpt: prod.excerpt?.rendered || null,
      content: prod.content?.rendered || null,
      price: getPrice(prod),
      image_url: getImageUrl(prod),
      stock: 50,
      status: "published",
    }));

    if (productsToInsert.length > 0) {
      console.log(`Inserting ${productsToInsert.length} products to Supabase...`);
      const { error } = await supabase.from("products").upsert(productsToInsert);
      if (error) console.error("Error bulk inserting products:", error.message);
    }

    const prodCatsToInsert: any[] = [];
    for (const prod of wpProducts) {
      if (prod.product_cat && Array.isArray(prod.product_cat)) {
        for (const catId of prod.product_cat) {
          const wpCat = wpProdCategories.find((c: any) => c.id === catId);
          if (wpCat) {
            const dbCat = dbCategories?.find(c => c.slug === wpCat.slug && c.type === 'product');
            if (dbCat) {
              prodCatsToInsert.push({ product_id: prod.id, category_id: dbCat.id });
            }
          }
        }
      }
    }

    if (prodCatsToInsert.length > 0) {
      console.log(`Inserting ${prodCatsToInsert.length} product category mappings...`);
      await supabase.from("product_categories").upsert(prodCatsToInsert, { onConflict: "product_id,category_id" });
    }

    // 3. Fetch & Seed Articles
    console.log("Fetching articles...");
    const postRes = await fetch(`${WP_API_URL}/posts?per_page=100&_embed=1`);
    const wpPosts = await postRes.json();
    console.log(`Found ${wpPosts.length} articles.`);

    const articlesToInsert = wpPosts.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      slug: post.slug,
      excerpt: post.excerpt?.rendered || null,
      content: post.content?.rendered || null,
      image_url: getImageUrl(post),
    }));

    if (articlesToInsert.length > 0) {
      console.log(`Inserting ${articlesToInsert.length} articles to Supabase...`);
      const { error } = await supabase.from("articles").upsert(articlesToInsert);
      if (error) console.error("Error bulk inserting articles:", error.message);
    }

    // 4. Fetch & Seed Recipes
    console.log("Fetching recipes...");
    const recRes = await fetch(`${WP_API_URL}/wprm_recipe?per_page=100&_embed=1`);
    const wpRecipes = await recRes.json();
    console.log(`Found ${wpRecipes.length} recipes.`);

    const recipesToInsert = wpRecipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title.rendered,
      slug: recipe.slug,
      excerpt: recipe.excerpt?.rendered || null,
      content: recipe.content?.rendered || null,
      image_url: getImageUrl(recipe),
      prep_time: recipe.wprm_prep_time || null,
      cook_time: recipe.wprm_cook_time || null,
    }));

    if (recipesToInsert.length > 0) {
      console.log(`Inserting ${recipesToInsert.length} recipes to Supabase...`);
      const { error } = await supabase.from("recipes").upsert(recipesToInsert);
      if (error) console.error("Error bulk inserting recipes:", error.message);
    }

    console.log("Migration Complete! 🎉");

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

seed();
