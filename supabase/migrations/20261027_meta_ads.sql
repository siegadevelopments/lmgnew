-- ============================================================
-- Migration: Meta ads (Admin > Ads)
--
-- ad_settings        one row: monthly spend cap and whether ads auto-pause on the stop rule.
-- ad_campaigns       one row per ad: product, budget, dates, copy, break-even maths, Meta ids.
-- ad_insights_daily  spend, clicks and Meta-reported purchases per ad per day (daily sync).
--
-- Admins only: the admin dashboard reads and edits them with the admin's session, and the
-- api/ads-* functions write them with the service role after checking the caller is an admin
-- (or the cron secret). No anon or non-admin access.
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ad_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_cap_cents integer NOT NULL DEFAULT 80000 CHECK (monthly_cap_cents >= 0),
  auto_pause boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ad_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id bigint,
  vendor_id uuid,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'paused', 'active', 'completed', 'error')),
  daily_budget_cents integer NOT NULL CHECK (daily_budget_cents BETWEEN 100 AND 100000),
  start_date date NOT NULL,
  end_date date NOT NULL,
  primary_text text NOT NULL,
  headline text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text NOT NULL,
  price_cents integer,
  commission_rate numeric,
  break_even_cents integer,
  stop_loss_cents integer,
  meta_campaign_id text,
  meta_adset_id text,
  meta_creative_id text,
  meta_ad_id text,
  last_error text,
  paused_reason text,
  -- Totals written by the daily sync (api/ads-sync.ts): Meta's figures and our own orders.
  spend_cents_total integer NOT NULL DEFAULT 0,
  meta_purchases_total integer NOT NULL DEFAULT 0,
  our_orders integer NOT NULL DEFAULT 0,
  our_revenue_cents integer NOT NULL DEFAULT 0,
  our_commission_cents integer NOT NULL DEFAULT 0,
  last_synced_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.ad_insights_daily (
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns (id) ON DELETE CASCADE,
  date date NOT NULL,
  spend_cents integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  meta_purchases integer NOT NULL DEFAULT 0,
  meta_purchase_value_cents integer NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, date)
);

ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_insights_daily ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ad_settings, public.ad_campaigns, public.ad_insights_daily FROM anon;

DROP POLICY IF EXISTS "Admins manage ad settings" ON public.ad_settings;
CREATE POLICY "Admins manage ad settings" ON public.ad_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Admins manage ad campaigns" ON public.ad_campaigns
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins read ad insights" ON public.ad_insights_daily;
CREATE POLICY "Admins read ad insights" ON public.ad_insights_daily
  FOR SELECT TO authenticated USING (public.is_admin());
