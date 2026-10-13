-- Security hardening: replace wide-open RLS policies and block self-promotion to admin.
-- Review before applying; apply via the Supabase SQL editor / CI like other migrations.

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin? SECURITY DEFINER so policies on other tables can call it
-- without recursing into profiles' own RLS.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- profiles: a signed-in user must not be able to make themselves (or anyone) an admin.
-- Service-role calls (auth.uid() IS NULL) and existing admins are unaffected.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- notifications: previously readable/updatable by everyone (including anonymous visitors).
-- Admins see everything; other users see only their own. Inserts stay open because the site
-- raises notifications from client code (orders, chat) — content is not trusted for anything.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;

CREATE POLICY "Read own or admin notifications" ON public.notifications
  FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Update own or admin notifications" ON public.notifications
  FOR UPDATE USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- marketing_plan_state: was world-readable and world-writable. Admin only.
-- (app/api/plan-90 now also requires an admin session.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to marketing_plan_state" ON public.marketing_plan_state;
DROP POLICY IF EXISTS "Allow write access to marketing_plan_state" ON public.marketing_plan_state;

CREATE POLICY "Admins manage marketing_plan_state" ON public.marketing_plan_state
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- chat: conversations between signed-in customers and vendors become private to the two
-- participants (+ admins).
--
-- KNOWN REMAINING GAP: guest support chats (customer_id IS NULL AND vendor_id IS NULL) are
-- identified only by a client-side guest id/email, so they still have to stay open to anon users
-- here. Closing that properly needs guest chat moved behind a server route (service role) that
-- issues a per-conversation secret. Tracked as follow-up; see docs/DEVELOPMENT_STANDARDS.md.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;

CREATE POLICY "Participants and admins access conversations" ON public.chat_conversations
  FOR ALL
  USING (
    public.is_admin()
    OR customer_id = auth.uid()
    OR vendor_id = auth.uid()
    OR (customer_id IS NULL AND vendor_id IS NULL)   -- guest support chat (see note above)
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
