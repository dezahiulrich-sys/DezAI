-- Storage buckets for SoundForge AI
-- Run this in Supabase SQL Editor

-- Audio files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aiff', 'audio/ogg', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Stems output bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stems',
  'stems',
  false,
  104857600, -- 100MB
  ARRAY['audio/wav', 'audio/flac', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- MIDI files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'midi',
  'midi',
  false,
  10485760, -- 10MB
  ARRAY['audio/midi', 'application/x-midi', 'audio/x-mid']
)
ON CONFLICT (id) DO NOTHING;

-- ZIP exports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  true,
  209715200, -- 200MB
  ARRAY['application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio bucket
CREATE POLICY "Users can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  auth.uid() = owner
);

CREATE POLICY "Users can view their own audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio' AND
  (auth.uid() = owner OR owner IS NULL)
);

CREATE POLICY "Users can delete their own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' AND
  auth.uid() = owner
);

-- Storage policies for stems bucket
CREATE POLICY "Service can upload stems"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'stems');

CREATE POLICY "Users can view stems"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'stems');

-- Storage policies for MIDI bucket
CREATE POLICY "Service can upload MIDI"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'midi');

CREATE POLICY "Users can view MIDI"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'midi');

CREATE POLICY "Users can download their MIDI"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'midi');

-- Storage policies for exports bucket (public for downloads)
CREATE POLICY "Anyone can view exports"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'exports');

CREATE POLICY "Service can upload exports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'exports');