import type { Metadata } from "next";
import Link from "next/link";
import { ReviewOrderForm } from "@/components/ReviewOrderForm";
import { findOrderByReviewToken, getAdminSupabase } from "@/lib/server-admin";
import { displayName } from "@/lib/reviews";

// Landing page for the review-request email: lists what the buyer ordered so they can rate it.
// Private per order (random token), so it's never indexed or cached.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Review your order",
  robots: { index: false, follow: false },
};

export default async function ReviewOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let order: Awaited<ReturnType<typeof findOrderByReviewToken>> = null;
  let items: any[] = [];
  let reviewed: number[] = [];
  try {
    order = await findOrderByReviewToken(token);
    if (order) {
      const db = getAdminSupabase();
      const [{ data: orderItems }, { data: existing }] = await Promise.all([
        db.from("order_items").select("product_id, product_name, product_image").eq("order_id", order.id),
        db.from("reviews").select("product_id").eq("order_id", order.id),
      ]);
      // One entry per product (an order can have the same product in two variants).
      const seen = new Set<number>();
      items = (orderItems ?? []).filter((i: any) => i.product_id && !seen.has(i.product_id) && seen.add(i.product_id));
      reviewed = (existing ?? []).map((r: any) => r.product_id);
    }
  } catch (err) {
    console.error("review page: lookup failed", err);
  }

  if (!order || items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">This review link has expired</h1>
        <p className="mt-3 text-muted-foreground">
          Review links work for a limited time. You can still browse{" "}
          <Link href="/products" className="font-medium text-primary hover:underline">
            our shop
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">How are you finding your order?</h1>
      <p className="mt-3 text-muted-foreground">
        Your honest review, good or bad, helps other shoppers choose with confidence. It will appear on the product page
        marked &ldquo;Verified purchase&rdquo;.
      </p>
      <ReviewOrderForm
        token={token}
        defaultName={displayName(order.first_name, order.last_name)}
        items={items.map((i) => ({ productId: i.product_id, name: i.product_name, image: i.product_image }))}
        alreadyReviewed={reviewed}
      />
    </div>
  );
}
