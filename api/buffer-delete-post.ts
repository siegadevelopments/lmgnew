import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { bufferPostId, bufferPostIds } = body;

    const token = process.env.BUFFER_ACCESS_TOKEN || process.env.VITE_BUFFER_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ error: "BUFFER_ACCESS_TOKEN is missing in Vercel environment variables." });
    }

    const idsToDelete: string[] = [];
    if (bufferPostId) idsToDelete.push(bufferPostId);
    if (Array.isArray(bufferPostIds)) idsToDelete.push(...bufferPostIds.filter(Boolean));

    if (idsToDelete.length === 0) {
      return res.status(400).json({ error: "No Buffer post ID(s) provided to delete." });
    }

    const deleteMutation = `
      mutation DeletePost($input: DeletePostInput!) {
        deletePost(input: $input) {
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

    const results = [];
    const errors: string[] = [];

    for (const id of idsToDelete) {
      try {
        const response = await fetch("https://api.buffer.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: deleteMutation,
            variables: { input: { id } },
          }),
        });

        const data = await response.json();
        if (data.errors && data.errors.length > 0) {
          errors.push(`ID ${id}: ${data.errors[0].message}`);
        } else if (data.data?.deletePost?.message) {
          errors.push(`ID ${id}: ${data.data.deletePost.message}`);
        } else if (data.data?.deletePost?.post?.id) {
          results.push(data.data.deletePost.post.id);
        } else {
          // If post is already gone in Buffer, count as clean delete
          results.push(id);
        }
      } catch (err: any) {
        errors.push(`ID ${id}: ${err.message}`);
      }
    }

    return res.status(200).json({ success: true, deleted: results, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Buffer Delete Error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete Buffer post(s)" });
  }
}
