-- ============================================================
-- Migration: tighten live RLS found in the 2026-10-21 policy snapshot
--
-- Already applied by hand on 2026-10-21 (recorded here; safe to re-run):
--   admin_update_user_email() and admin_delete_user() were SECURITY DEFINER and executable by
--   anonymous visitors. Not used by the app; now service role only.
--
-- 1. vendor_withdrawals: the admin policy trusted user_metadata.role, which every user can set on
--    their own account (supabase.auth.updateUser({ data: { role: 'admin' } })). Now is_admin().
-- 2. orders / order_items: "anyone can insert" policies let anonymous visitors create orders
--    (e.g. marked paid, triggering vendor notifications). Orders are created only by the
--    stripe-webhook function with the service role, which bypasses RLS.
-- 3. vendor_profiles: vendors could approve their own store, set their own commission and toggle
--    store visibility (is_live). Those columns are now admin-only (silently kept on vendor saves).
-- 4. vendor_profiles: anonymous visitors could read every column, incl. commission_rate and
--    ai_instructions. They now get every column except commission_rate, ai_enabled,
--    ai_instructions and representative_name. Signed-in reads are unchanged.
-- 5. products: everyone could read drafts and archived products. Now published only, plus a
--    vendor's own products (admins keep full access via "Admins can manage all products").
-- 6. notifications: anyone can still insert (the site raises admin notifications from the
--    browser), but links must be site-relative, so a notification can't point to another site.
--
-- Safe to run more than once.
-- ============================================================

-- 0. Admin account functions (applied by hand on 2026-10-21)
REVOKE ALL ON FUNCTION public.admin_update_user_email(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_email(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO service_role;

-- 1. Withdrawals
DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON public.vendor_withdrawals;
DROP POLICY IF EXISTS "Admins manage withdrawal requests" ON public.vendor_withdrawals;
CREATE POLICY "Admins manage withdrawal requests" ON public.vendor_withdrawals
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Orders: no inserts from browsers
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- 3. Store approval, commission and visibility are admin-only
CREATE OR REPLACE FUNCTION public.protect_vendor_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (auth.uid() IS NULL) and admins may change anything.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_approved := false;
    NEW.commission_rate := NULL; -- platform default applies
  ELSE
    NEW.is_approved := OLD.is_approved;
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_live := OLD.is_live;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_vendor_admin_columns ON public.vendor_profiles;
CREATE TRIGGER trg_protect_vendor_admin_columns
  BEFORE INSERT OR UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_vendor_admin_columns();

-- 4. Anonymous visitors: no commission or AI settings
REVOKE SELECT ON public.vendor_profiles FROM anon;
DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'vendor_profiles'
     AND column_name NOT IN ('commission_rate', 'ai_enabled', 'ai_instructions', 'representative_name');
  EXECUTE format('GRANT SELECT (%s) ON public.vendor_profiles TO anon', cols);
END $$;

-- 5. Products: published only, plus your own
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Published products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Vendors can view own products" ON public.products;
CREATE POLICY "Published products are viewable by everyone" ON public.products
  FOR SELECT USING (status = 'published');
CREATE POLICY "Vendors can view own products" ON public.products
  FOR SELECT TO authenticated USING (auth.uid() = vendor_id);

-- 6. Notifications: site-relative links only
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Insert notifications with site links" ON public.notifications;
CREATE POLICY "Insert notifications with site links" ON public.notifications
  FOR INSERT WITH CHECK (link IS NULL OR (link LIKE '/%' AND link NOT LIKE '//%'));
