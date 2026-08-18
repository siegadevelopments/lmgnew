-- Migration: Notifications and Support Chat enhancements

-- Create notifications table
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

-- Policies for notifications
DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
CREATE POLICY "Allow read notifications" ON public.notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications" ON public.notifications
    FOR UPDATE USING (true);

-- Ensure chat_conversations table exists with support chat support
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_name TEXT,
    guest_email TEXT,
    is_support BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open',
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure chat_messages table exists
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID,
    sender_type TEXT DEFAULT 'user', -- 'user', 'admin', 'vendor', 'guest'
    sender_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for chat
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for chat_conversations" ON public.chat_conversations;
CREATE POLICY "Allow all for chat_conversations" ON public.chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for chat_messages" ON public.chat_messages;
CREATE POLICY "Allow all for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
