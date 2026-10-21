-- ============================================================
-- Migration: adjust stock when orders are paid and refunded
--
-- Run BEFORE deploying the stripe-webhook version that calls adjust_order_stock().
--
-- Stock was never reduced after a sale, so a product could be sold past its stock.
-- adjust_order_stock(order, items, restock):
--   restock = false: reduce stock for a paid order, once (orders.stock_adjusted_at).
--   restock = true:  put it back after a full refund, once, and only if it was reduced
--                    (orders.stock_restored_at). Orders from before this change are untouched.
-- The "once" check and the stock changes run in one transaction, so a retried or duplicate
-- webhook can't adjust twice.
--
-- items: [{ "product_id": 7, "variant_key": "<variant id or null>", "quantity": 2 }]
-- When the item's variant has its own numeric stock, that is adjusted; otherwise the product's
-- stock. Stock never goes below zero.
--
-- Only the service role (the webhook) can call it.
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_adjusted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_restored_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.adjust_order_stock(p_order_id uuid, p_items jsonb, p_restock boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it jsonb;
  pid bigint;
  qty int;
  vkey text;
  delta int;
  vtype text;
  vars jsonb;
BEGIN
  IF p_restock THEN
    UPDATE public.orders SET stock_restored_at = now()
     WHERE id = p_order_id AND stock_adjusted_at IS NOT NULL AND stock_restored_at IS NULL;
  ELSE
    UPDATE public.orders SET stock_adjusted_at = now()
     WHERE id = p_order_id AND stock_adjusted_at IS NULL;
  END IF;
  IF NOT FOUND THEN
    RETURN 'skipped';
  END IF;

  -- products.variants may be json or jsonb; write it back as whichever it is.
  SELECT data_type INTO vtype FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'variants';

  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
    pid  := NULLIF(it->>'product_id', '')::bigint;
    qty  := GREATEST(COALESCE(NULLIF(it->>'quantity', '')::int, 0), 0);
    vkey := NULLIF(it->>'variant_key', '');
    CONTINUE WHEN pid IS NULL OR qty = 0;
    delta := CASE WHEN p_restock THEN qty ELSE -qty END;

    vars := NULL;
    IF vkey IS NOT NULL AND vtype IS NOT NULL THEN
      SELECT variants::jsonb INTO vars FROM public.products WHERE id = pid FOR UPDATE;
    END IF;

    IF jsonb_typeof(vars) = 'array' AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(vars) v
       WHERE v->>'id' = vkey AND (v->>'stock') ~ '^-?[0-9]+$'
    ) THEN
      vars := (
        SELECT jsonb_agg(
                 CASE WHEN v->>'id' = vkey AND (v->>'stock') ~ '^-?[0-9]+$'
                      THEN jsonb_set(v, '{stock}', to_jsonb(GREATEST((v->>'stock')::int + delta, 0)))
                      ELSE v END
                 ORDER BY ord)
          FROM jsonb_array_elements(vars) WITH ORDINALITY AS t(v, ord)
      );
      EXECUTE format('UPDATE public.products SET variants = ($1)::%s WHERE id = $2', vtype) USING vars, pid;
    ELSE
      UPDATE public.products SET stock = GREATEST(COALESCE(stock, 0) + delta, 0) WHERE id = pid;
    END IF;
  END LOOP;

  RETURN 'adjusted';
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_order_stock(uuid, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_order_stock(uuid, jsonb, boolean) TO service_role;
