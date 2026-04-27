-- Enable RLS for chat tables
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
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE id = chat_messages.conversation_id 
    AND (customer_id = auth.uid() OR vendor_id = auth.uid())
  )
);
