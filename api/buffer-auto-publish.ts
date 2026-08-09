import type { VercelRequest, VercelResponse } from "@vercel/node";

const BUFFER_ORGANIZATION_ID = "687880bd75ffe60432da70c6";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { posts, imageUrl, scheduledAt } = body;

    const token = process.env.BUFFER_ACCESS_TOKEN || process.env.VITE_BUFFER_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: "BUFFER_ACCESS_TOKEN is missing in Vercel environment variables." });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "An imageUrl is strictly required for automated Buffer publishing to Facebook, Instagram, and Pinterest." });
    }

    // 1. Fetch available channels to map dynamically
    const channelQuery = `
      query GetChannels($input: ChannelsInput!) {
        channels(input: $input) {
          id
          service
        }
      }
    `;

    const channelRes = await fetch("https://api.buffer.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        query: channelQuery,
        variables: { input: { organizationId: BUFFER_ORGANIZATION_ID } }
      })
    });
    
    const channelData = await channelRes.json();
    
    if (channelData.errors && channelData.errors.length > 0) {
      console.error("Buffer API Error (Channels):", channelData.errors);
      return res.status(400).json({ error: `Buffer API Error: ${channelData.errors[0].message}` });
    }
    
    const channels = channelData.data?.channels || [];
    
    if (channels.length === 0) {
      return res.status(400).json({ error: "No connected channels found for this Buffer organization." });
    }

    // 2. Prepare payload
    const platforms = [
      { name: "facebook", text: posts?.facebook },
      { name: "instagram", text: posts?.instagram },
      { name: "pinterest", text: posts?.pinterest },
    ];

    const results = [];
    const errors: string[] = [];

    // 3. Post to Queue
    const postQuery = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post {
              id
            }
          }
          ... on MutationError {
            message
          }
        }
      }
    `;

    for (const platform of platforms) {
      let text = platform.text;
      if (!text) continue;
      
      // Pinterest strictly enforces a maximum text / caption length of 500 characters
      if (platform.name === "pinterest" && text.length > 500) {
        text = text.slice(0, 497) + "...";
      }

      const channel = channels.find((c: any) => c.service === platform.name);
      if (!channel) {
        errors.push(`${platform.name}: No matching channel connected in Buffer.`);
        continue;
      }

      // Prepare metadata requirements for Facebook/Instagram
      let metadata: any = undefined;
      if (platform.name === "facebook") {
        metadata = { facebook: { type: "post" } };
      } else if (platform.name === "instagram") {
        metadata = { instagram: { type: "post", shouldShareToFeed: true } };
      }

      const response = await fetch("https://api.buffer.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: postQuery,
          variables: {
            input: {
              channelId: channel.id,
              text,
              assets: [{ image: { url: imageUrl } }],
              mode: scheduledAt ? "customScheduled" : "addToQueue",
              schedulingType: "automatic",
              dueAt: scheduledAt ? scheduledAt : undefined,
              saveToDraft: false,
              metadata
            },
          },
        }),
      });

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        errors.push(`${platform.name}: ${data.errors[0].message}`);
      } else if (data.data?.createPost?.message) {
        errors.push(`${platform.name}: ${data.data.createPost.message}`);
      } else if (data.data?.createPost?.post?.id) {
        results.push({ platform: platform.name, id: data.data.createPost.post.id });
      } else {
        errors.push(`${platform.name}: Unknown Buffer response`);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return res.status(400).json({ error: errors.join(" | ") });
    }

    return res.status(200).json({ success: true, results, warnings: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Buffer API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to automate Buffer posts" });
  }
}
