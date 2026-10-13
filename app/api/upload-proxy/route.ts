import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";

const MAX_BYTES = 100 * 1024 * 1024;

// Only forward to Cloudflare R2 presigned URLs. Without this the route is an SSRF / open relay:
// the server would PUT to any caller-supplied URL (including internal addresses).
function isAllowedUploadUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const extra = process.env.R2_ENDPOINT ? new URL(process.env.R2_ENDPOINT).hostname : "";
    return u.protocol === "https:" && (u.hostname.endsWith(".r2.cloudflarestorage.com") || (!!extra && u.hostname === extra));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireUser(req, "authenticated");
  if (denied) return denied;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadUrl = formData.get("uploadUrl") as string;

    if (!file || !uploadUrl) {
      return NextResponse.json({ error: "Missing file or uploadUrl" }, { status: 400 });
    }

    if (!isAllowedUploadUrl(uploadUrl)) {
      return NextResponse.json({ error: "Upload URL not allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Proxy the upload to the pre-signed URL to bypass browser CORS issues
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Proxy R2 upload failed:", response.status, errorText);
      return NextResponse.json(
        { error: `R2 proxy upload failed: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Proxy upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
