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
    const { title, posts } = body;

    const token = process.env.BUFFER_ACCESS_TOKEN || process.env.VITE_BUFFER_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: "BUFFER_ACCESS_TOKEN is missing in Vercel environment variables." });
    }

    const platforms = [
      { name: "Facebook", text: posts?.facebook },
      { name: "Instagram", text: posts?.instagram },
      { name: "Pinterest", text: posts?.pinterest },
    ];

    const results = [];
    const errors: string[] = [];

    for (const platform of platforms) {
      if (!platform.text) continue;

      const query = `
        mutation CreateIdea($input: CreateIdeaInput!) {
          createIdea(input: $input) {
            ... on Idea {
              id
              content {
                title
                text
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `;

      const response = await fetch("https://api.buffer.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            input: {
              organizationId: BUFFER_ORGANIZATION_ID,
              content: {
                title: `${platform.name} - ${title || "Social Post"}`,
                text: platform.text,
              },
            },
          },
        }),
      });

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        errors.push(`${platform.name}: ${data.errors[0].message}`);
      } else if (data.data?.createIdea?.message) {
        errors.push(`${platform.name}: ${data.data.createIdea.message}`);
      } else if (data.data?.createIdea?.id) {
        results.push({ platform: platform.name, id: data.data.createIdea.id });
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
    return res.status(500).json({ error: error.message || "Failed to create Buffer ideas" });
  }
}
