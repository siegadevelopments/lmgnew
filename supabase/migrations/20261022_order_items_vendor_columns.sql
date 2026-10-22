-- ============================================================
-- Migration: vendors can only change fulfilment fields on their order lines
--
-- "Vendors can update their own order items" has no column restriction, so a vendor could change
-- the price, quantity, product, order or vendor of their own order lines. The vendor dashboard
-- (src/components/vendor/OrdersTab.tsx) only ever changes status and tracking_number.
--
-- For signed-in non-admins, every other column is kept as it was (silently, so the dashboard's
-- updates keep working). Admins and the service role (webhook) are unaffected.
--
-- Safe to run more than once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_order_item_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  -- Start from the old row and apply only the fulfilment fields.
  RETURN jsonb_populate_record(OLD, jsonb_build_object('status', NEW.status, 'tracking_number', NEW.tracking_number));
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_order_item_columns ON public.order_items;
CREATE TRIGGER trg_protect_order_item_columns
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.protect_order_item_columns();
