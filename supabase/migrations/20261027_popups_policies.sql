-- ============================================================
-- Migration: popups readable by visitors (active only) and manageable by admins
--
-- public.popups has RLS enabled but had no policies (live snapshot, 2026-10-21), so nobody using
-- the site could read it: visitors never saw any popup, and the admin Popups tab couldn't load or
-- save. Found when the sleep-guide popup was activated on 2026-10-27 and didn't appear.
--
-- Safe to run more than once.
-- ============================================================

DROP POLICY IF EXISTS "Active popups are viewable by everyone" ON public.popups;
CREATE POLICY "Active popups are viewable by everyone" ON public.popups
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage popups" ON public.popups;
CREATE POLICY "Admins manage popups" ON public.popups
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
