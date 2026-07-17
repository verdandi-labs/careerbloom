
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

CREATE TABLE public.cv_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section text NOT NULL,
  content_en text DEFAULT '',
  content_es text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, section)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_content TO authenticated;
GRANT ALL ON public.cv_content TO service_role;
ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cv_content select" ON public.cv_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own cv_content insert" ON public.cv_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cv_content update" ON public.cv_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own cv_content delete" ON public.cv_content FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER cv_content_touch BEFORE UPDATE ON public.cv_content FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.cover_letters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text NOT NULL,
  job_description text,
  content_en text DEFAULT '',
  content_es text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cover_letters TO authenticated;
GRANT ALL ON public.cover_letters TO service_role;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cover_letters select" ON public.cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own cover_letters insert" ON public.cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cover_letters update" ON public.cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own cover_letters delete" ON public.cover_letters FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER cover_letters_touch BEFORE UPDATE ON public.cover_letters FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
