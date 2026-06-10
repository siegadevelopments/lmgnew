import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );

    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: "Supabase error", details: error.message });
    }

    const { data: countData, error: countError } = await supabase
      .from("scheduled_posts")
      .select("status", { count: "exact", head: false });

    // Summary of statuses
    const summary = posts.reduce((acc: any, post: any) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      time: new Date().toISOString(),
      summary,
      countData,
      posts: posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        scheduled_at: p.scheduled_at,
        published_at: p.published_at,
        platforms: p.platforms,
        error_message: p.error_message,
        fb_post_id: p.fb_post_id,
        ig_post_id: p.ig_post_id,
        source_url: p.source_url,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Server exception", message: err.message });
  }
}
