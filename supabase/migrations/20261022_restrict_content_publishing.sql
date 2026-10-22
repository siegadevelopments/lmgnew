-- ============================================================
-- Migration: only admins and approved vendors can publish content
--
-- Any signed-in user could create articles, recipes, galleries and gallery items under their own
-- id ("Authors can manage their articles" etc. are FOR ALL with only an ownership check), and all
-- of them are shown publicly: an easy route for spam and junk links on the site.
--
-- can_publish(): the caller is an admin, or has an APPROVED vendor store. Not the "vendor" role:
-- users give themselves that role by starting vendor signup. Store approval is admin-only
-- (20261022_tighten_rls.sql), so it can't be self-granted.
--
-- Creating and editing require can_publish(); authors can always delete their own content.
-- Existing content is untouched. Admin policies and public read policies are unchanged, and
-- server-side functions (service role) bypass RLS.
--
-- Safe to run more than once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_publish()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
      OR EXISTS (SELECT 1 FROM public.vendor_profiles WHERE id = auth.uid() AND is_approved);
$$;
REVOKE ALL ON FUNCTION public.can_publish() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_publish() TO authenticated;

-- Articles -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can manage their articles" ON public.articles;
DROP POLICY IF EXISTS "Publishers create articles" ON public.articles;
DROP POLICY IF EXISTS "Publishers edit own articles" ON public.articles;
DROP POLICY IF EXISTS "Authors delete own articles" ON public.articles;
CREATE POLICY "Publishers create articles" ON public.articles FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_publish());
CREATE POLICY "Publishers edit own articles" ON public.articles FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.can_publish())
  WITH CHECK (author_id = auth.uid() AND public.can_publish());
CREATE POLICY "Authors delete own articles" ON public.articles FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Recipes ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can manage their recipes" ON public.recipes;
DROP POLICY IF EXISTS "Publishers create recipes" ON public.recipes;
DROP POLICY IF EXISTS "Publishers edit own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Authors delete own recipes" ON public.recipes;
CREATE POLICY "Publishers create recipes" ON public.recipes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_publish());
CREATE POLICY "Publishers edit own recipes" ON public.recipes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.can_publish())
  WITH CHECK (author_id = auth.uid() AND public.can_publish());
CREATE POLICY "Authors delete own recipes" ON public.recipes FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Galleries ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Vendors can manage own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Publishers create galleries" ON public.galleries;
DROP POLICY IF EXISTS "Publishers edit own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Owners delete own galleries" ON public.galleries;
CREATE POLICY "Publishers create galleries" ON public.galleries FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.can_publish());
CREATE POLICY "Publishers edit own galleries" ON public.galleries FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() AND public.can_publish())
  WITH CHECK (vendor_id = auth.uid() AND public.can_publish());
CREATE POLICY "Owners delete own galleries" ON public.galleries FOR DELETE TO authenticated
  USING (vendor_id = auth.uid());

-- Gallery items (ownership via the parent gallery) --------------------------------
DROP POLICY IF EXISTS "Vendors can manage own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Publishers add gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Publishers edit own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Owners delete own gallery items" ON public.gallery_items;
CREATE POLICY "Publishers add gallery items" ON public.gallery_items FOR INSERT TO authenticated
  WITH CHECK (public.can_publish() AND EXISTS (
    SELECT 1 FROM public.galleries g WHERE g.id = gallery_items.gallery_id AND (g.vendor_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Publishers edit own gallery items" ON public.gallery_items FOR UPDATE TO authenticated
  USING (public.can_publish() AND EXISTS (
    SELECT 1 FROM public.galleries g WHERE g.id = gallery_items.gallery_id AND (g.vendor_id = auth.uid() OR public.is_admin())))
  WITH CHECK (public.can_publish() AND EXISTS (
    SELECT 1 FROM public.galleries g WHERE g.id = gallery_items.gallery_id AND (g.vendor_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Owners delete own gallery items" ON public.gallery_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.galleries g WHERE g.id = gallery_items.gallery_id AND (g.vendor_id = auth.uid() OR public.is_admin())));
