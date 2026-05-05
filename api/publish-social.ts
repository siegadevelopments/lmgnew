import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Authenticate as admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );

    const userClient = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

    // 2. Get post to publish
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ error: "post_id required" });

    const { data: post, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.status === "published") {
      return res.status(400).json({ error: "Post already published" });
    }

    const platforms = post.platforms || ["facebook", "instagram"];
    const results: Record<string, any> = {};

    // 3. Build the full post text
    const fullCaption = `${post.caption}\n\n${(post.hashtags || []).map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    const linkUrl = post.source_url
      ? `https://lifestylemedicinegateway.com${post.source_url}`
      : "https://lifestylemedicinegateway.com";

    // 4. Publish to Facebook
    if (platforms.includes("facebook")) {
      const FB_PAGE_ID = process.env.META_PAGE_ID;
      const FB_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

      if (FB_PAGE_ID && FB_ACCESS_TOKEN) {
        try {
          const fbBody: any = {
            message: fullCaption,
            link: linkUrl,
            access_token: FB_ACCESS_TOKEN,
          };

          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fbBody),
          });

          const fbData = await fbRes.json();
          if (fbData.id) {
            results.facebook = { success: true, post_id: fbData.id };
          } else {
            results.facebook = { success: false, error: fbData.error?.message || "Unknown error" };
          }
        } catch (fbErr: any) {
          results.facebook = { success: false, error: fbErr.message };
        }
      } else {
        results.facebook = { success: false, error: "Facebook credentials not configured" };
      }
    }

    // 5. Publish to Instagram
    if (platforms.includes("instagram")) {
      const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID;
      const IG_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN; // Same token for IG via Page

      if (IG_ACCOUNT_ID && IG_ACCESS_TOKEN && post.image_url) {
        try {
          // Step 1: Create media container
          const containerRes = await fetch(
            `https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/media`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_url: post.image_url,
                caption: fullCaption,
                access_token: IG_ACCESS_TOKEN,
              }),
            },
          );

          const containerData = await containerRes.json();

          if (containerData.id) {
            // Step 2: Publish the container
            const publishRes = await fetch(
              `https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/media_publish`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  creation_id: containerData.id,
                  access_token: IG_ACCESS_TOKEN,
                }),
              },
            );

            const publishData = await publishRes.json();
            if (publishData.id) {
              results.instagram = { success: true, post_id: publishData.id };
            } else {
              results.instagram = {
                success: false,
                error: publishData.error?.message || "Publish failed",
              };
            }
          } else {
            results.instagram = {
              success: false,
              error: containerData.error?.message || "Container creation failed",
            };
          }
        } catch (igErr: any) {
          results.instagram = { success: false, error: igErr.message };
        }
      } else if (!post.image_url) {
        results.instagram = {
          success: false,
          error: "Instagram requires an image. Add an image to this post.",
        };
      } else {
        results.instagram = { success: false, error: "Instagram credentials not configured" };
      }
    }

    // 6. Update post status
    const anySuccess = Object.values(results).some((r: any) => r.success);
    const allFailed = Object.values(results).every((r: any) => !r.success);

    const updatePayload: any = {
      status: allFailed ? "failed" : "published",
      published_at: anySuccess ? new Date().toISOString() : null,
      fb_post_id: results.facebook?.post_id || null,
      ig_post_id: results.instagram?.post_id || null,
      error_message: allFailed
        ? Object.values(results)
            .map((r: any) => r.error)
            .join("; ")
        : null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("scheduled_posts").update(updatePayload).eq("id", post_id);

    return res.status(200).json({
      success: anySuccess,
      results,
      message: anySuccess
        ? "Post published successfully!"
        : "Publishing failed. Check error details.",
    });
  } catch (error: any) {
    console.error("Publish social error:", error);
    return res.status(500).json({ error: error.message });
  }
}
