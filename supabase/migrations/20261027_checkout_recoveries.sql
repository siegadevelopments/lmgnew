-- ============================================================
-- Migration: abandoned-checkout reminders
--
-- One row per expired Stripe Checkout session, written only by the stripe-webhook function
-- (service role). It makes the checkout.session.expired handler idempotent (Stripe retries),
-- records why a reminder was or wasn't sent, and links a recovered order back to the reminder.
--
-- Admins can read it; nobody else can read or write it (no anon/authenticated policies).
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checkout_recoveries (
  stripe_session_id text PRIMARY KEY,
  email text,
  amount_cents integer,
  session_created_at timestamptz,
  email_sent_at timestamptz,
  skipped_reason text,
  recovered_order_id text,
  recovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_recoveries_email_sent_idx
  ON public.checkout_recoveries (email, email_sent_at);

ALTER TABLE public.checkout_recoveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.checkout_recoveries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.checkout_recoveries FROM authenticated;

DROP POLICY IF EXISTS "Admins read checkout recoveries" ON public.checkout_recoveries;
CREATE POLICY "Admins read checkout recoveries" ON public.checkout_recoveries
  FOR SELECT TO authenticated USING (public.is_admin());
