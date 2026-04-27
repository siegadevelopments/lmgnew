CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chat_conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id),
  UNIQUE(customer_id, vendor_id)
);

-- Ensure the foreign key exists even if the table was already created
ALTER TABLE chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_customer_id_fkey;
ALTER TABLE chat_conversations ADD CONSTRAINT chat_conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure foreign keys for messages
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view their own conversations" 
ON chat_conversations FOR SELECT 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Customers can create conversations" ON chat_conversations;
CREATE POLICY "Customers can create conversations" 
ON chat_conversations FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;
CREATE POLICY "Users can update their own conversations" 
ON chat_conversations FOR UPDATE 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- Policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations" 
ON chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE id = chat_messages.conversation_id 
    AND (customer_id = auth.uid() OR vendor_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;
CREATE POLICY "Users can send messages in their conversations" 
ON chat_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE id = chat_messages.conversation_id 
    AND (customer_id = auth.uid() OR vendor_id = auth.uid())
  )
);
