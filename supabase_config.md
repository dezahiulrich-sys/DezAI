# Configuration Supabase pour DezAI

## Étape 1 : Créer un projet Supabase

1. **Allez sur** : https://supabase.com/dashboard/org/uwrlqsofjhghzjtkhxlk
2. **Cliquez sur "New Project"**
3. **Configurez le projet** :
   - **Name** : `dezai` ou `DezAI`
   - **Database Password** : Créez un mot de passe sécurisé (notez-le)
   - **Region** : Choisissez une région proche (Europe de l'Ouest)
   - **Pricing Plan** : Free tier (pour commencer)
4. **Cliquez sur "Create new project"**

## Étape 2 : Récupérer les clés API

Une fois le projet créé (cela prend 1-2 minutes) :

1. **Allez dans Settings > API**
2. **Copiez ces informations** :
   - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role** key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (gardez-la secrète)

## Étape 3 : Configurer l'authentification

1. **Allez dans Authentication > Providers**
2. **Activez Email Provider** :
   - Confirm email : Désactivé (pour le développement)
   - Secure email change : Activé
3. **Activez Google Provider** (optionnel) :
   - Client ID : Obtenez-le depuis Google Cloud Console
   - Client Secret : Obtenez-le depuis Google Cloud Console
4. **Configurez Site URL** :
   - Site URL : `https://dezai-audio-analysis.netlify.app`
   - Additional Redirect URLs : `http://localhost:5173`

## Étape 4 : Configurer le stockage

1. **Allez dans Storage > Create new bucket**
2. **Créez un bucket** :
   - **Name** : `audio-files`
   - **Public** : Oui (pour permettre l'accès aux fichiers)
3. **Configurez les politiques** (déjà dans le SQL) :
   - Les utilisateurs authentifiés peuvent uploader
   - Les utilisateurs peuvent lire leurs propres fichiers

## Étape 5 : Exécuter le script SQL

1. **Allez dans SQL Editor**
2. **Créez une nouvelle query**
3. **Copiez-collez le contenu de `supabase_setup.sql`**
4. **Exécutez la query** (bouton Run)
5. **Vérifiez que tout s'est bien passé**

## Étape 6 : Mettre à jour les variables d'environnement

### Pour le développement local :
Mettez à jour `frontend/.env.local` :
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEMUCS_API_URL=http://localhost:8000
```

### Pour la production :
Mettez à jour `frontend/.env.production` :
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEMUCS_API_URL=https://your-demucs-api.herokuapp.com
```

### Pour Netlify :
1. **Allez sur** : https://app.netlify.com/projects/dezai-audio-analysis/settings/deploys#environment
2. **Ajoutez les variables** :
   - `VITE_SUPABASE_URL` : Votre Project URL
   - `VITE_SUPABASE_ANON_KEY` : Votre anon public key

### Pour GitHub Actions :
1. **Allez sur** : https://github.com/dezahiulrich-sys/DezAI/settings/secrets/actions
2. **Ajoutez les secrets** :
   - `VITE_SUPABASE_URL` : Votre Project URL
   - `VITE_SUPABASE_ANON_KEY` : Votre anon public key

## Étape 7 : Tester la configuration

### Test 1 : Authentification
```bash
# Redémarrez le frontend
cd frontend
npm run dev
```
Visitez `http://localhost:5173` et testez :
- Création de compte
- Connexion
- Déconnexion

### Test 2 : Upload de fichier
1. Connectez-vous
2. Uploader un fichier audio
3. Vérifiez dans Supabase Storage que le fichier apparaît

### Test 3 : Base de données
1. Allez dans Supabase > Table Editor
2. Vérifiez que les tables `audio_analyses` et `user_profiles` existent
3. Vérifiez qu'un profil utilisateur a été créé après inscription

## Étape 8 : Configuration avancée

### Email Templates (optionnel)
1. **Allez dans Authentication > Templates**
2. **Personnalisez les emails** :
   - Confirm signup
   - Reset password
   - Change email

### Row Level Security (RLS)
Les politiques RLS sont déjà configurées dans le SQL :
- Les utilisateurs ne voient que leurs propres données
- Les utilisateurs ne peuvent modifier que leurs propres données

### Functions Edge (optionnel)
1. **Allez dans Functions**
2. **Créez une fonction** pour le traitement audio
3. **Déclencheurs** : Après upload de fichier

## Dépannage

### Problème 1 : "Invalid login credentials"
- Vérifiez que l'authentification email est activée
- Vérifiez les Site URL dans Authentication > URL Configuration

### Problème 2 : "Storage bucket not found"
- Vérifiez que le bucket `audio-files` existe
- Vérifiez les politiques de stockage

### Problème 3 : "RLS policy violation"
- Vérifiez que l'utilisateur est authentifié
- Vérifiez les politiques RLS dans le SQL

### Problème 4 : "CORS error"
- Allez dans Settings > API
- Ajoutez `http://localhost:5173` et `https://dezai-audio-analysis.netlify.app` aux URLs autorisées

## URLs importantes

- **Dashboard Supabase** : https://supabase.com/dashboard/org/uwrlqsofjhghzjtkhxlk
- **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
- **API Documentation** : `https://xxxxxxxxxxxx.supabase.co/docs`
- **Storage Browser** : `https://xxxxxxxxxxxx.supabase.co/storage`
- **Auth Users** : `https://xxxxxxxxxxxx.supabase.co/auth/users`

## Commandes utiles

```bash
# Mettre à jour les variables d'environnement localement
cd frontend
echo "VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env.local

# Redémarrer l'application
npm run dev

# Vérifier la connexion Supabase
curl https://xxxxxxxxxxxx.supabase.co/rest/v1/
```

## Support

- **Documentation Supabase** : https://supabase.com/docs
- **Discord Supabase** : https://discord.supabase.com
- **GitHub Issues** : https://github.com/dezahiulrich-sys/DezAI/issues

---

**Note** : Gardez les clés `service_role` secrètes et ne les exposez jamais côté client.