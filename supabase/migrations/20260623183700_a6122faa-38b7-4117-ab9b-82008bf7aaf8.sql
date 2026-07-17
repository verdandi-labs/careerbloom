CREATE TABLE public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat_conversations select" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chat_conversations insert" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat_conversations update" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own chat_conversations delete" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER chat_conversations_touch BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  suggestion jsonb,
  applied_text text,
  rejected boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat_messages select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chat_messages insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat_messages update" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own chat_messages delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX chat_messages_conversation_idx ON public.chat_messages(conversation_id, created_at);
CREATE INDEX chat_conversations_user_updated_idx ON public.chat_conversations(user_id, updated_at DESC);