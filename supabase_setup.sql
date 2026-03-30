-- Supabase Setup for DezAI
-- Run this SQL in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audio analyses table
CREATE TABLE IF NOT EXISTS audio_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Analysis results
  bpm INTEGER,
  key TEXT,
  duration_seconds DECIMAL(10, 2),
  energy_level DECIMAL(3, 2),
  genre TEXT,
  style TEXT,
  
  -- Stems information
  stems_generated BOOLEAN DEFAULT FALSE,
  stems_urls JSONB DEFAULT '{}',
  
  -- MIDI information
  midi_generated BOOLEAN DEFAULT FALSE,
  midi_urls JSONB DEFAULT '{}',
  
  -- Processing status
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audio_analyses_user_id ON audio_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_analyses_created_at ON audio_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_analyses_status ON audio_analyses(status);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Usage tracking
  total_uploads INTEGER DEFAULT 0,
  total_processing_time INTEGER DEFAULT 0, -- in seconds
  last_upload_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "default_format": "mp3",
    "auto_generate_midi": true,
    "email_notifications": true,
    "theme": "dark"
  }',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create storage policies for audio files
-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- Policy: Allow users to read their own files
CREATE POLICY "Users can read their own audio files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_audio_analyses_updated_at
  BEFORE UPDATE ON audio_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create view for user analysis summary
CREATE OR REPLACE VIEW user_analysis_summary AS
SELECT 
  up.user_id,
  up.email,
  up.full_name,
  COUNT(DISTINCT aa.id) as total_analyses,
  SUM(CASE WHEN aa.status = 'completed' THEN 1 ELSE 0 END) as completed_analyses,
  SUM(CASE WHEN aa.status = 'processing' THEN 1 ELSE 0 END) as processing_analyses,
  SUM(CASE WHEN aa.status = 'failed' THEN 1 ELSE 0 END) as failed_analyses,
  COALESCE(SUM(aa.duration_seconds), 0) as total_audio_duration,
  MAX(aa.created_at) as last_analysis_date
FROM user_profiles up
LEFT JOIN audio_analyses aa ON up.user_id = aa.user_id
GROUP BY up.user_id, up.email, up.full_name;

-- Enable Row Level Security
ALTER TABLE audio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_analyses
CREATE POLICY "Users can view their own analyses"
ON audio_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
ON audio_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
ON audio_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON audio_analyses FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Insert sample data (optional)
-- INSERT INTO audio_analyses (user_id, filename, bpm, key, duration_seconds, status)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual user_id
--   'sample-track.mp3',
--   128,
--   'C# minor',
--   180.5,
--   'completed'
-- );

-- Print success message
SELECT 'Supabase setup completed successfully!' as message;