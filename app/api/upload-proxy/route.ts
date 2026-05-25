import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadUrl = formData.get("uploadUrl") as string;

    if (!file || !uploadUrl) {
      return NextResponse.json({ error: "Missing file or uploadUrl" }, { status: 400 });
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
        { error: `R2 proxy upload failed: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Proxy upload API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
