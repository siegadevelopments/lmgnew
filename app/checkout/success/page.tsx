'use client'

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { reportPendingPurchase } from "@/lib/tracking";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const { user } = useAuth();

  // Stripe only sends the customer here after payment succeeds, so the cart can be emptied and the
  // purchase reported to analytics (once: the saved order is removed when reported).
  useEffect(() => {
    reportPendingPurchase();
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Thank you for your order!</h1>
        <p className="mt-3 text-muted-foreground">
          Your payment was successful. A confirmation email is on its way to you.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          {user && (
            <Button asChild variant="outline">
              <Link href="/profile">View Orders</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
