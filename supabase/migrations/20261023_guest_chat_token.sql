-- ============================================================
-- Migration: guest support chats are private to the guest's browser
--
-- Guest support conversations (customer_id and vendor_id both NULL) were readable and writable by
-- anyone: the policies allowed every such row, and the browser only filtered by a guessable
-- guest id or email. Now each guest browser holds a long random secret (localStorage), sends it as
-- the x-guest-token request header, and the conversation stores it in guest_token. Policies allow a
-- guest conversation (and its messages) only when the header matches. Admins, signed-in customers
-- and vendors are unaffected.
--
-- On 2026-10-21 anonymous visitors could see 0 chat conversations, i.e. there were no guest
-- conversations, so no guest loses history.
--
-- Supabase Realtime can't carry the header, so guests poll for new messages
-- (src/components/chat/GlobalChat.tsx).
--
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS guest_token TEXT;

-- The x-guest-token header PostgREST received with this request (NULL when absent).
CREATE OR REPLACE FUNCTION public.request_guest_token()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.headers', true)::json ->> 'x-guest-token', '');
$$;

-- A guest conversation the caller holds the secret for. Short tokens are refused outright.
CREATE OR REPLACE FUNCTION public.is_my_guest_chat(p_customer uuid, p_vendor uuid, p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_customer IS NULL AND p_vendor IS NULL
     AND p_token IS NOT NULL AND length(p_token) >= 32
     AND p_token = public.request_guest_token();
$$;

DROP POLICY IF EXISTS "Participants and admins access conversations" ON public.chat_conversations;
CREATE POLICY "Participants and admins access conversations" ON public.chat_conversations
  FOR ALL
  USING (
    public.is_admin()
    OR customer_id = auth.uid()
    OR vendor_id = auth.uid()
    OR public.is_my_guest_chat(customer_id, vendor_id, guest_token)
  )
  WITH CHECK (
    public.is_admin()
    OR customer_id = auth.uid()
    OR vendor_id = auth.uid()
    OR public.is_my_guest_chat(customer_id, vendor_id, guest_token)
  );

DROP POLICY IF EXISTS "Participants and admins access messages" ON public.chat_messages;
CREATE POLICY "Participants and admins access messages" ON public.chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND (public.is_admin() OR c.customer_id = auth.uid() OR c.vendor_id = auth.uid()
             OR public.is_my_guest_chat(c.customer_id, c.vendor_id, c.guest_token))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND (public.is_admin() OR c.customer_id = auth.uid() OR c.vendor_id = auth.uid()
             OR public.is_my_guest_chat(c.customer_id, c.vendor_id, c.guest_token))
    )
  );
