import { NextResponse } from "next/server";
import { findOrderByReviewToken, getAdminSupabase } from "@/lib/server-admin";
import { displayName, validateReviewInput } from "@/lib/reviews";

// Verified-purchase review submission from the private link in the review-request email. The
// token proves the buyer; the product must be part of that order. One review per product per
// order (re-submitting updates it). Written with the service role, so it works without an account.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = validateReviewInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    const order = await findOrderByReviewToken(String(body?.token ?? ""));
    if (!order) return NextResponse.json({ error: "This review link has expired or isn't valid." }, { status: 404 });

    const db = getAdminSupabase();
    const productId = Number(body?.product_id);
    const { data: item } = await db
      .from("order_items")
      .select("product_id, product_slug")
      .eq("order_id", order.id)
      .eq("product_id", productId)
      .limit(1)
      .maybeSingle();
    if (!item) return NextResponse.json({ error: "That product isn't part of this order." }, { status: 400 });

    const review = {
      product_id: productId,
      product_slug: item.product_slug ?? "",
      rating: input.value.rating,
      title: input.value.title || null,
      content: input.value.content || null,
      reviewer_name: input.value.name || displayName(order.first_name, order.last_name) || null,
      verified_purchase: true,
      order_id: order.id,
      user_id: order.user_id ?? null,
    };

    // Update an existing review for this order (re-submit), or the buyer's own earlier review of
    // the product (signed-in buyers), else create one.
    let existingId: string | null = null;
    const byOrder = await db.from("reviews").select("id").eq("order_id", order.id).eq("product_id", productId).maybeSingle();
    existingId = byOrder.data?.id ?? null;
    if (!existingId && order.user_id) {
      const byUser = await db.from("reviews").select("id").eq("user_id", order.user_id).eq("product_id", productId).limit(1).maybeSingle();
      existingId = byUser.data?.id ?? null;
    }
    const { error } = existingId
      ? await db.from("reviews").update(review).eq("id", existingId)
      : await db.from("reviews").insert(review);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("reviews: submit failed", err?.message ?? err);
    return NextResponse.json({ error: "We couldn't save your review. Please try again." }, { status: 500 });
  }
}
