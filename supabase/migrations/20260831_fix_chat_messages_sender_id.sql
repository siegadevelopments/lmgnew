-- Fix: Allow null sender_id for guest users and bot messages
-- The sender_id column had a NOT NULL constraint and a foreign key to auth.users,
-- which prevented guest users and the Health Guru bot from saving messages.

-- 1. Drop the foreign key constraint on sender_id
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;

-- 2. Allow sender_id to be NULL
ALTER TABLE public.chat_messages ALTER COLUMN sender_id DROP NOT NULL;

-- 3. Re-add the foreign key but allow NULLs (ON DELETE SET NULL) so it still
--    validates when a real user ID is provided, but allows NULL for guests/bots
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable Realtime for chat tables (needed for live subscriptions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
