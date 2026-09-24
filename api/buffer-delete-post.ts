import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.lifestylemedicinegateway.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // This deletes real, live Buffer posts by ID and was previously callable by anyone —
    // it must be admin-only, same as the rest of the admin Marketing tab's endpoints.
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

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

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
