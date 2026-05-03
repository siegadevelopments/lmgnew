-- Fix chat_messages sender_id constraint
-- The AI bot sends messages as vendor_id (from vendor_profiles),
-- but the FK points to profiles(id). We relax the constraint to auth.users
-- so that any authenticated user (including vendors) can be a sender.

-- Step 1: Drop the restrictive FK pointing to profiles
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;

-- Step 2: Add a relaxed FK pointing to auth.users instead
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Also allow the service role to insert AI responses without RLS blocking
-- (The API endpoint uses the service role key, so this shouldn't be needed,
--  but we ensure the INSERT policy covers vendor_id as sender)
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can send messages in their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE id = chat_messages.conversation_id
    AND (customer_id = auth.uid() OR vendor_id = auth.uid())
  )
  -- Also allow service role (used by AI endpoint) - handled automatically by Supabase
);

-- Step 4: Ensure vendor can also read all messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE id = chat_messages.conversation_id
    AND (customer_id = auth.uid() OR vendor_id = auth.uid())
  )
);
