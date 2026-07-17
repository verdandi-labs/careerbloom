-- Profile fields for template + photo
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cv_template TEXT NOT NULL DEFAULT 'editorial',
  ADD COLUMN IF NOT EXISTS cv_photo_url TEXT;

-- Storage policies for photos bucket (bucket itself created via storage tool)
CREATE POLICY "Photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Users can upload their own photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own photo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);