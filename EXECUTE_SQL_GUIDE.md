# Guide d'exécution du script SQL Supabase

## Problème rencontré
```
Error: Failed to run sql query: ERROR: 42601: syntax error at or near "Task" LINE 1: Task Completed ^
```

## Solution

### Étape 1 : Accéder au SQL Editor
1. **Allez sur** : https://supabase.com/dashboard/project/_/sql
   (Remplacez `_` par l'ID de votre projet)

### Étape 2 : Créer une nouvelle query
1. **Cliquez sur "New query"** (en haut à droite)
2. **Nommez la query** : "DezAI Database Setup"

### Étape 3 : Copier le script simplifié
**Copiez ce contenu exactement :**

```sql
-- Supabase Setup for DezAI - Simplified Version

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
```

### Étape 4 : Exécuter le script
1. **Collez le script** dans l'éditeur
2. **Cliquez sur "Run"** (bouton bleu)
3. **Attendez** l'exécution (quelques secondes)

### Étape 5 : Vérifier l'exécution
**Résultat attendu :**
```
Supabase setup completed successfully!
```

**Si vous voyez une erreur :**
1. **Notez le message d'erreur exact**
2. **Vérifiez la ligne mentionnée**
3. **Assurez-vous qu'il n'y a pas de texte supplémentaire**

## Erreurs courantes et solutions

### 1. "extension "uuid-ossp" already exists"
- **Solution** : C'est normal, continuez

### 2. "relation "auth.users" does not exist"
- **Solution** : L'authentification n'est pas encore configurée
- **Action** : Configurez d'abord l'authentification dans Authentication > Providers

### 3. "permission denied for schema storage"
- **Solution** : Exécutez le script en tant qu'admin
- **Action** : Utilisez le compte admin du projet

### 4. "syntax error at or near..."
- **Solution** : Vérifiez les guillemets et les points-virgules
- **Action** : Copiez exactement le script ci-dessus

## Exécution par étapes (alternative)

Si le script complet échoue, exécutez-le par parties :

### Partie 1 : Extensions et tables
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS audio_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  filename TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  bpm INTEGER,
  key TEXT,
  duration_seconds DECIMAL(10, 2),
  energy_level DECIMAL(3, 2),
  genre TEXT,
  style TEXT,
  stems_generated BOOLEAN DEFAULT FALSE,
  stems_urls JSONB DEFAULT '{}',
  midi_generated BOOLEAN DEFAULT FALSE,
  midi_urls JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  total_uploads INTEGER DEFAULT 0,
  total_processing_time INTEGER DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{"default_format": "mp3", "auto_generate_midi": true, "email_notifications": true, "theme": "dark"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Partie 2 : Stockage
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can manage their own audio files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid() = owner);
```

### Partie 3 : Sécurité
```sql
ALTER TABLE audio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analyses"
ON audio_analyses FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile"
ON user_profiles FOR ALL
USING (auth.uid() = user_id);
```

## Vérification finale

Après exécution réussie :

1. **Allez dans Table Editor**
   - Vérifiez que `audio_analyses` et `user_profiles` existent

2. **Allez dans Storage**
   - Vérifiez que le bucket `audio-files` existe

3. **Allez dans Authentication > Providers**
   - Activez au moins Email provider

4. **Testez avec l'application**
   - Redémarrez `npm run dev`
   - Testez l'inscription
   - Testez l'upload

## Support

Si les problèmes persistent :
1. **Capturez d'écran** de l'erreur
2. **Vérifiez les logs** dans Supabase
3. **Contactez le support** Supabase

**URLs utiles :**
- SQL Editor : `https://supabase.com/dashboard/project/[PROJECT-ID]/sql`
- Table Editor : `https://supabase.com/dashboard/project/[PROJECT-ID]/editor`
- Storage : `https://supabase.com/dashboard/project/[PROJECT-ID]/storage`
- Authentication : `https://supabase.com/dashboard/project/[PROJECT-ID]/auth/users`