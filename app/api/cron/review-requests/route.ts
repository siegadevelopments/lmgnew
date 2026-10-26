import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/server-admin";
import {
  REVIEW_REQUEST_AFTER_DAYS,
  REVIEW_REQUEST_MAX_AGE_DAYS,
  SITE_URL,
  newReviewToken,
  reviewRequestEmail,
} from "@/lib/reviews";

// Daily (vercel.json crons): email a review link to each paid, unrefunded order placed 10–30 days
// ago that hasn't been asked yet. Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export const dynamic = "force-dynamic";
const BATCH = 50;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Fail before marking any order as asked, so nothing is lost once the key is added.
    console.error("review-requests: RESEND_API_KEY is not set in Vercel; no emails sent");
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const db = getAdminSupabase();
  const now = Date.now();
  const { data: orders, error } = await db
    .from("orders")
    .select("id, email, first_name")
    .eq("payment_status", "paid")
    .in("status", ["confirmed", "shipped", "delivered", "completed"])
    .is("review_requested_at", null)
    .lte("created_at", new Date(now - REVIEW_REQUEST_AFTER_DAYS * 86400_000).toISOString())
    .gte("created_at", new Date(now - REVIEW_REQUEST_MAX_AGE_DAYS * 86400_000).toISOString())
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    console.error("review-requests: order query failed", error.message);
    return NextResponse.json({ error: "Order query failed" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  for (const order of orders ?? []) {
    const { data: items } = await db.from("order_items").select("product_name").eq("order_id", order.id);
    const productNames = (items ?? []).map((i: any) => i.product_name).filter(Boolean);
    if (!order.email || productNames.length === 0) {
      skipped++;
      continue;
    }

    // Claim the order first, so overlapping runs never email twice.
    const token = newReviewToken();
    const { data: claimed } = await db
      .from("orders")
      .update({ review_token: token, review_requested_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("review_requested_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    const { subject, html } = reviewRequestEmail({
      firstName: order.first_name ?? "",
      productNames,
      link: `${SITE_URL}/review/${token}`,
    });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({ from: "Lifestyle Medicine Gateway <orders@lifestylemedicinegateway.com>", to: [order.email], subject, html }),
    });
    if (res.ok) sent++;
    else console.error(`review-requests: email for order ${order.id} failed: HTTP ${res.status}`);
  }

  return NextResponse.json({ checked: orders?.length ?? 0, sent, skipped });
}
