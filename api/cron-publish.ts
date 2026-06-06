import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { publishSocialPost } from "./_publish-helper";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // SECURE CRON IN PRODUCTION
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized request received to cron-publish");
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // Instantiate Supabase client with Service Role to bypass RLS
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );

    // Fetch posts that are approved and scheduled to be published (scheduled_at <= now)
    const nowISO = new Date().toISOString();
    const { data: posts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "approved")
      .lte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      console.error("Cron fetch scheduled posts error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch scheduled posts", details: fetchError.message });
    }

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending scheduled posts due for publication.",
        published: [],
      });
    }

    console.log(`Cron: Found ${posts.length} scheduled posts due to be published.`);

    const publishResults: Array<{ id: string; title: string; success: boolean; result: any }> = [];

    // Publish each due post
    for (const post of posts) {
      try {
        console.log(`Cron: Publishing post "${post.title}" (ID: ${post.id})...`);
        const result = await publishSocialPost(supabase, post);
        publishResults.push({
          id: post.id,
          title: post.title,
          success: result.success,
          result,
        });
      } catch (err: any) {
        console.error(`Cron: Exception while publishing post ${post.id}:`, err);
        publishResults.push({
          id: post.id,
          title: post.title,
          success: false,
          result: { error: err.message },
        });
      }
    }

    const successfulCount = publishResults.filter(r => r.success).length;
    const failedCount = publishResults.length - successfulCount;

    return res.status(200).json({
      success: true,
      message: `Completed cron social publishing. Published ${successfulCount} successfully, ${failedCount} failed.`,
      results: publishResults,
    });
  } catch (error: any) {
    console.error("Cron publisher general error:", error);
    return res.status(500).json({ error: error.message });
  }
}
