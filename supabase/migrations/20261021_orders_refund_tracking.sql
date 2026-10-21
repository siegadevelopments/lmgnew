-- ============================================================
-- Migration: track Stripe refunds on orders
--
-- Run BEFORE deploying the stripe-webhook version that handles charge.refunded: that version
-- writes stripe_payment_intent on every new order, and an insert naming a missing column fails.
--
-- stripe_payment_intent: links a Stripe refund (which references the payment, not the checkout
--   session) back to its order. Older orders are matched through Stripe and backfilled on first
--   refund.
-- refunded_cents: cumulative amount already reversed for this order. Stripe reports the charge's
--   cumulative amount_refunded, so the webhook reverses only the difference; replayed or repeated
--   partial refunds can't double-count.
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_cents INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_idx
  ON public.orders (stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;
