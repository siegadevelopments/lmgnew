-- Follow and Chat Features Schema

-- Vendor Follows
CREATE TABLE IF NOT EXISTS public.vendor_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- Chat Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Follows
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own follows') THEN
    CREATE POLICY "Users can view their own follows" ON public.vendor_follows FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can follow/unfollow vendors') THEN
    CREATE POLICY "Users can follow/unfollow vendors" ON public.vendor_follows FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies for Conversations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own conversations') THEN
    CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT 
    USING (auth.uid() = customer_id OR auth.uid() = vendor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can start conversations') THEN
    CREATE POLICY "Users can start conversations" ON public.chat_conversations FOR INSERT 
    WITH CHECK (auth.uid() = customer_id);
  END IF;
END $$;

-- Policies for Messages
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view messages in their conversations') THEN
    CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.chat_conversations 
        WHERE id = chat_messages.conversation_id 
        AND (customer_id = auth.uid() OR vendor_id = auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can send messages in their conversations') THEN
    CREATE POLICY "Users can send messages in their conversations" ON public.chat_messages FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.chat_conversations 
        WHERE id = chat_messages.conversation_id 
        AND (customer_id = auth.uid() OR vendor_id = auth.uid())
      )
      AND sender_id = auth.uid()
    );
  END IF;
END $$;
