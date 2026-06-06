export async function publishSocialPost(supabase: any, post: any) {
  const platforms = post.platforms || ["facebook", "instagram"];
  const results: Record<string, any> = {};

  // 1. Build the full post text
  const fullCaption = `${post.caption}\n\n${(post.hashtags || []).map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
  const linkUrl = post.source_url
    ? `https://lifestylemedicinegateway.com${post.source_url}`
    : "https://lifestylemedicinegateway.com";

  // 2. Publish to Facebook
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

  // 3. Publish to Instagram
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

  // 4. Update post status
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

  const { error: updateError } = await supabase
    .from("scheduled_posts")
    .update(updatePayload)
    .eq("id", post.id);

  if (updateError) {
    console.error(`Error updating post status for post ${post.id}:`, updateError);
  }

  return {
    success: anySuccess,
    results,
    message: anySuccess
      ? "Post published successfully!"
      : `Publishing failed: ${updatePayload.error_message}`,
  };
}
