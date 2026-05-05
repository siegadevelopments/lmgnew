import fs from "fs";

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

const MOOIE_ID = "05405cad-926a-466a-bc28-2ad719cf50e7";
const ETRAINING_ID = "93d69f39-d250-40f5-a1bd-3aca8591ee1d";

const MOOIE_LINKS = [
  "https://lifestylemedicinegateway.com/the-new-facci-system-by-mooie-makeup/",
  "https://lifestylemedicinegateway.com/refill-refresh-radiant-the-mooie-way/",
];

async function migrate() {
  try {
    const rawData = fs.readFileSync("d:\\antigravity\\lmgnew\\scratch\\articles_data.json", "utf8");
    const articles = JSON.parse(rawData);

    console.log(`Read ${articles.length} articles from JSON.`);

    // 1. Delete all existing articles
    console.log("Deleting existing articles...");
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=gt.0`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!delRes.ok) {
      const err = await delRes.text();
      console.warn("Delete might have failed or table empty:", err);
    }

    // 2. Insert new articles
    const toInsert = articles.map((art) => {
      const isMooie = MOOIE_LINKS.some(
        (link) => art.link === link || art.link === link.slice(0, -1),
      );
      return {
        title: art.title,
        content: art.content,
        excerpt: art.excerpt,
        image_url: art.image_url,
        slug: art.slug,
        author_id: isMooie ? MOOIE_ID : ETRAINING_ID,
        category_name: isMooie ? "Beauty" : "Wellness",
      };
    });

    console.log(`Inserting ${toInsert.length} articles...`);

    // Chunk inserts if too many
    const chunkSize = 20;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(chunk),
      });

      if (insRes.ok) {
        console.log(
          `Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(toInsert.length / chunkSize)}`,
        );
      } else {
        const err = await insRes.text();
        console.error(`Failed chunk ${i / chunkSize}:`, err);
      }
    }

    console.log("Migration process finished.");
  } catch (err) {
    console.error("Script error:", err);
  }
}

migrate();
