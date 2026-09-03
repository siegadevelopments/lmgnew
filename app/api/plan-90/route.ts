import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseUrl = rawUrl.startsWith("http") ? rawUrl : (process.env.SUPABASE_URL || "");
  
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  const supabaseKey = (rawKey && rawKey !== "[SENSITIVE]") ? rawKey : (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ state: {} });
    }

    const { data, error } = await supabase
      .from("marketing_plan_state")
      .select("state")
      .eq("id", "singleton")
      .maybeSingle();

    if (error) {
      console.warn("Marketing plan fetch warning:", error.message);
      return NextResponse.json({ state: {} });
    }

    return NextResponse.json({ state: data?.state || {} });
  } catch (err: any) {
    console.error("Error fetching marketing plan state:", err);
    return NextResponse.json({ state: {} });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { state } = body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: "No Supabase credentials configured" });
    }

    const { error } = await supabase
      .from("marketing_plan_state")
      .upsert({ 
        id: "singleton", 
        state,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

    if (error) {
      console.warn("Marketing plan upsert warning:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating marketing plan state:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
