"use client";

import { freeShippingProgress } from "@/lib/checkout-pricing";

// "Add $12.51 more for free shipping": nudges baskets over the free-shipping threshold (half the
// catalogue costs under it). Hidden for empty and bookings-only carts, which never pay shipping.
export function FreeShippingProgress({ subtotal, bookingsOnly = false }: { subtotal: number; bookingsOnly?: boolean }) {
  if (subtotal <= 0 || bookingsOnly) return null;
  const { qualified, remaining, percent } = freeShippingProgress(subtotal);
  return (
    <div className="rounded-lg bg-primary/5 px-3 py-2" aria-live="polite">
      <p className="text-xs font-medium text-foreground">
        {qualified ? "🎉 You've got free shipping!" : `Add $${remaining.toFixed(2)} more for free shipping`}
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/10" role="presentation">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
