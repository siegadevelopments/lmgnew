-- ============================================================
-- Migration: orders.attribution
--
-- Where each paid order came from: UTM tags and Meta/Google click ids from the shopper's landing
-- URL (last click within 30 days), e.g. {"utm_source":"facebook","utm_medium":"paid",
-- "utm_campaign":"Nov Founder's Formula","utm_content":"<ad id>","landing_path":"/products/..."}.
-- Written only by the stripe-webhook function. Covered by the existing orders policies.
-- Run BEFORE deploying the stripe-webhook version that writes it (it falls back if missing).
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attribution jsonb;

CREATE INDEX IF NOT EXISTS orders_attribution_campaign_idx
  ON public.orders ((attribution->>'utm_campaign'))
  WHERE attribution IS NOT NULL;
