import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with Service Role Key to bypass RLS for this specific generic state table
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("marketing_plan_state")
      .select("state")
      .eq("id", "singleton")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found, return empty state
        return NextResponse.json({ state: {} });
      }
      throw error;
    }

    return NextResponse.json({ state: data.state || {} });
  } catch (err: any) {
    console.error("Error fetching marketing plan state:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { state } = body;

    const { error } = await supabase
      .from("marketing_plan_state")
      .upsert({ 
        id: "singleton", 
        state,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating marketing plan state:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
