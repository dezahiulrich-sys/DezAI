-- Supabase Setup for DezAI - Simplified Version
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
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Usage tracking
  total_uploads INTEGER DEFAULT 0,
  total_processing_time INTEGER DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferences JSONB DEFAULT '{"default_format": "mp3", "auto_generate_midi": true, "email_notifications": true, "theme": "dark"}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Simple storage policy
CREATE POLICY "Users can manage their own audio files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid() = owner);

-- Enable Row Level Security
ALTER TABLE audio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Users can manage their own analyses"
ON audio_analyses FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile"
ON user_profiles FOR ALL
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_audio_analyses_updated_at
  BEFORE UPDATE ON audio_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Supabase setup completed successfully!' as message;