import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.from("scheduled_posts").select("id, title, status, platforms, error_message, updated_at").order("updated_at", { ascending: false }).limit(5);
  console.log("Latest posts:", data);
  if (error) console.error("Error:", error);
}

run();
