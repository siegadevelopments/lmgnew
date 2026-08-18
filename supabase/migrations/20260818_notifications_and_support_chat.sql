-- Migration: Notifications and Support Chat enhancements

-- 1. Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT DEFAULT 'admin',
    type TEXT NOT NULL CHECK (type IN ('order', 'message', 'content', 'vendor', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);

-- 2. Ensure chat_conversations table exists and ALTER existing table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make vendor_id and customer_id nullable for support and guest chats
ALTER TABLE public.chat_conversations ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE public.chat_conversations ALTER COLUMN customer_id DROP NOT NULL;

-- Add support chat columns to existing chat_conversations table
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS is_support BOOLEAN DEFAULT false;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- 3. Ensure chat_messages table exists and ALTER existing table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'user';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- RLS policies for chat
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for chat_conversations" ON public.chat_conversations;
CREATE POLICY "Allow all for chat_conversations" ON public.chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;
CREATE POLICY "Allow all for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
