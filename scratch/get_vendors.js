const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcnRheHZqd2lkZnhhamJqbHBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3MzE5NywiZXhwIjoyMDkyMzQ5MTk3fQ.RiajvpzGhhSnx8ZjqcoRnHWe1u_PuhoYD5CZTBGhG-Y";

async function getVendors() {
  const url = `${SUPABASE_URL}/rest/v1/vendor_profiles?select=id,store_name&or=(store_name.ilike.*Mooie*,store_name.ilike.*e-training*)`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const data = await response.json();
  console.log(JSON.stringify(data));
}

getVendors();
