-- ============================================================
-- Migration: Apply the security hardening that never reached production
--
-- 20261001_security_hardening.sql was committed but not applied to the live database (checked
-- 2026-10-21: no self-promotion trigger on profiles, notifications readable by anonymous
-- visitors). That file can't simply be re-run: its CREATE POLICY statements fail if any policy
-- already exists. This file applies the same changes idempotently, plus one addition (5).
--
-- 1. is_admin(): the role column in profiles, the same check the admin dashboard, the /api
--    admin routes and the admin-api edge function already use. Anyone who can use the admin
--    dashboard today already has profiles.role = 'admin', so this can't lock an admin out.
-- 2. profiles: a signed-in user can no longer make themselves (or anyone) an admin. Before
--    this, "Users can update own profile" allowed `role = 'admin'` on your own row, which every
--    server-side admin check would then accept. Other role changes (customer -> vendor during
--    vendor signup) are unaffected.
-- 3. notifications: only the owner and admins can read/update (was everyone, incl. anonymous).
-- 4. marketing_plan_state: admins only. chat: participants and admins (guest support chats
--    stay open, as documented in the original migration).
-- 5. NEW: anonymous visitors can read only id, full_name, avatar_url and role from profiles
--    (needed for review author names and the search role lookup), not phone numbers.
--    Remaining gap: signed-in users can still read other users' phone numbers. Closing that
--    needs the own-phone reads in checkout/profile/product pages moved to a function first.
--
-- Safe to run more than once. Runs as one transaction in the Supabase SQL Editor: if any statement
-- fails, nothing is applied. Sections for tables that don't exist are skipped with a NOTICE.
-- ============================================================

-- 1. Admin check -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Block admin self-promotion ------------------------------------------------
-- Service-role calls (auth.uid() IS NULL) and existing admins are unaffected.
CREATE OR REPLACE FUNCTION public.prevent_admin_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'
     AND (TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role)
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin can assign the admin role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_self_promotion ON public.profiles;
CREATE TRIGGER trg_prevent_admin_self_promotion
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_promotion();

-- Sections 3 and 4 only run for tables that exist: the live database is missing some tables
-- whose creating migrations were never applied either (marketing_plan_state, as of 2026-10-21).
-- A missing table is skipped with a NOTICE instead of aborting the whole migration.

-- 3. notifications -------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RAISE NOTICE 'notifications does not exist, skipped';
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Read own or admin notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Update own or admin notifications" ON public.notifications;

  CREATE POLICY "Read own or admin notifications" ON public.notifications
    FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

  CREATE POLICY "Update own or admin notifications" ON public.notifications
    FOR UPDATE USING (public.is_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_admin() OR user_id = auth.uid());
END $$;

-- 4a. marketing_plan_state -----------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.marketing_plan_state') IS NULL THEN
    RAISE NOTICE 'marketing_plan_state does not exist, skipped';
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Allow public read access to marketing_plan_state" ON public.marketing_plan_state;
  DROP POLICY IF EXISTS "Allow write access to marketing_plan_state" ON public.marketing_plan_state;
  DROP POLICY IF EXISTS "Admins manage marketing_plan_state" ON public.marketing_plan_state;

  CREATE POLICY "Admins manage marketing_plan_state" ON public.marketing_plan_state
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
END $$;

-- 4b. chat ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.chat_conversations') IS NULL OR to_regclass('public.chat_messages') IS NULL THEN
    RAISE NOTICE 'chat tables do not exist, skipped';
    RETURN;
  END IF;
  DROP POLICY IF EXISTS "Allow all for chat_conversations" ON public.chat_conversations;
  DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;
  DROP POLICY IF EXISTS "Participants and admins access conversations" ON public.chat_conversations;
  DROP POLICY IF EXISTS "Participants and admins access messages" ON public.chat_messages;

  CREATE POLICY "Participants and admins access conversations" ON public.chat_conversations
    FOR ALL
    USING (
      public.is_admin()
      OR customer_id = auth.uid()
      OR vendor_id = auth.uid()
      OR (customer_id IS NULL AND vendor_id IS NULL)   -- guest support chat (known gap)
    )
    WITH CHECK (
      public.is_admin()
      OR customer_id = auth.uid()
      OR vendor_id = auth.uid()
      OR (customer_id IS NULL AND vendor_id IS NULL)
    );

  CREATE POLICY "Participants and admins access messages" ON public.chat_messages
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.chat_conversations c
        WHERE c.id = chat_messages.conversation_id
          AND (public.is_admin() OR c.customer_id = auth.uid() OR c.vendor_id = auth.uid()
               OR (c.customer_id IS NULL AND c.vendor_id IS NULL))
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.chat_conversations c
        WHERE c.id = chat_messages.conversation_id
          AND (public.is_admin() OR c.customer_id = auth.uid() OR c.vendor_id = auth.uid()
               OR (c.customer_id IS NULL AND c.vendor_id IS NULL))
      )
    );
END $$;

-- 5. profiles: hide phone numbers (and any future column) from anonymous visitors ------
-- Column allowlist: a column added to profiles later stays hidden from anon until granted here.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, role) ON public.profiles TO anon;
