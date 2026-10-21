-- ============================================================
-- Migration: make the Stripe webhook safe to retry
--
-- Run BEFORE deploying the new stripe-webhook function, which reads and writes processed_at.
--
-- 1. orders.processed_at: set once an order's items, earnings, bookings and notifications are
--    all done. A retried webhook for an order without it finishes the missing steps instead of
--    returning "already processed" and leaving the order half-built.
-- 2. One order per Stripe Checkout session, enforced by the database, so two deliveries of the
--    same event arriving at once can't both create an order.
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE stripe_session_id IS NOT NULL
    GROUP BY stripe_session_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate orders share a stripe_session_id; resolve them before adding the unique index';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_key
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
