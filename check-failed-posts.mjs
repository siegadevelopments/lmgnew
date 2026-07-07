import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from("scheduled_posts").select("*").eq("status", "failed").limit(5);
  console.log("Failed posts:", data);
  if (error) console.error("Error:", error);
}

run();
