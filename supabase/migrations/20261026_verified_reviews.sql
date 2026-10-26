-- ============================================================
-- Migration: verified-purchase reviews from post-order review requests
--
-- The site had no reviews at all, and only signed-in users could write one, so guest buyers
-- (most orders) couldn't. A daily job (app/api/cron/review-requests) now emails each paid order a
-- private link about 10 days after purchase; the buyer can review what they bought without an
-- account, and the review is marked "verified purchase".
--
-- reviews:  user_id becomes optional (guest buyers), reviewer_name for guests, verified_purchase,
--           order_id; one review per product per order.
-- orders:   review_token (random, unique) and review_requested_at (sent once).
-- Trigger:  signed-in users can't mark their own reviews as verified or attach them to an order;
--           only server code (service role) and admins can.
--
-- Reviews are published as submitted (Australian Consumer Law: don't suppress negative reviews).
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_product_key
  ON public.reviews (order_id, product_id) WHERE order_id IS NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS orders_review_token_key
  ON public.orders (review_token) WHERE review_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_review_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verified_purchase := false;
    NEW.order_id := NULL;
  ELSE
    NEW.verified_purchase := OLD.verified_purchase;
    NEW.order_id := OLD.order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_review_verification ON public.reviews;
CREATE TRIGGER trg_protect_review_verification
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_verification();
