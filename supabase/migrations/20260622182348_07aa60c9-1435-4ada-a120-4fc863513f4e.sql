CREATE TABLE public.cv_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  approved_text text NOT NULL,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_edits TO authenticated;
GRANT ALL ON public.cv_edits TO service_role;

ALTER TABLE public.cv_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cv edits" ON public.cv_edits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cv edits" ON public.cv_edits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cv edits" ON public.cv_edits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cv edits" ON public.cv_edits
  FOR DELETE USING (auth.uid() = user_id);