import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    build_time: new Date().toISOString(),
    message: "Deployment test - version 5 (fixed queries)",
    environment: process.env.NODE_ENV,
  });
}
