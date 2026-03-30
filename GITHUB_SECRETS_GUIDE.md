# Configuration des secrets GitHub Actions

## Pourquoi configurer les secrets ?

Les secrets GitHub permettent de stocker de manière sécurisée les clés API et autres informations sensibles nécessaires au déploiement automatique.

## Secrets nécessaires pour DezAI

### 1. **NETLIFY_AUTH_TOKEN**
- **Description** : Token d'authentification Netlify
- **Comment l'obtenir** :
  ```bash
  netlify token
  ```
  Ou allez sur : https://app.netlify.com/user/applications/personal

### 2. **NETLIFY_SITE_ID**
- **Description** : ID de votre site Netlify
- **Valeur** : `cffa9d21-9ef4-4e7f-a9cc-ab197828f00f`

### 3. **VITE_SUPABASE_URL**
- **Description** : URL de votre projet Supabase
- **Valeur** : `https://xxxxxxxx.supabase.co` (remplacez par votre URL)

### 4. **VITE_SUPABASE_ANON_KEY**
- **Description** : Clé publique anonyme Supabase
- **Valeur** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (remplacez par votre clé)

## Comment ajouter les secrets

### Étape 1 : Accéder aux secrets
1. **Allez sur** : https://github.com/dezahiulrich-sys/DezAI/settings/secrets/actions
2. **Cliquez sur "New repository secret"**

### Étape 2 : Ajouter chaque secret

#### Secret 1 : NETLIFY_AUTH_TOKEN
- **Name** : `NETLIFY_AUTH_TOKEN`
- **Secret** : Votre token Netlify
- **Cliquez sur "Add secret"**

#### Secret 2 : NETLIFY_SITE_ID
- **Name** : `NETLIFY_SITE_ID`
- **Secret** : `cffa9d21-9ef4-4e7f-a9cc-ab197828f00f`
- **Cliquez sur "Add secret"**

#### Secret 3 : VITE_SUPABASE_URL
- **Name** : `VITE_SUPABASE_URL`
- **Secret** : Votre URL Supabase (ex: `https://xxxxxxxx.supabase.co`)
- **Cliquez sur "Add secret"**

#### Secret 4 : VITE_SUPABASE_ANON_KEY
- **Name** : `VITE_SUPABASE_ANON_KEY`
- **Secret** : Votre clé anon Supabase
- **Cliquez sur "Add secret"**

## Vérification

### Vérifier que les secrets sont configurés
1. **Allez sur** : https://github.com/dezahiulrich-sys/DezAI/settings/secrets/actions
2. **Vérifiez** que les 4 secrets apparaissent dans la liste

### Tester le workflow
1. **Allez sur** : https://github.com/dezahiulrich-sys/DezAI/actions
2. **Cliquez sur "Deploy to Netlify"**
3. **Cliquez sur "Run workflow"** (bouton vert)
4. **Sélectionnez "Run workflow"** sans modifier les paramètres
5. **Attendez** que le workflow se termine (2-3 minutes)

## Dépannage

### Problème 1 : "NETLIFY_AUTH_TOKEN is not defined"
- **Solution** : Vérifiez que le secret est correctement nommé
- **Vérifiez** : Le nom doit être exactement `NETLIFY_AUTH_TOKEN`

### Problème 2 : "Invalid Netlify token"
- **Solution** : Régénérez le token
  ```bash
  netlify logout
  netlify login
  netlify token
  ```

### Problème 3 : "Supabase connection failed"
- **Solution** : Vérifiez les URLs et clés Supabase
- **Testez** : `curl https://xxxxxxxx.supabase.co/rest/v1/`

### Problème 4 : "Workflow not triggered"
- **Solution** : Vérifiez les permissions
- **Allez sur** : Settings > Actions > General
- **Vérifiez** que "Allow all actions" est sélectionné

## Commandes utiles

### Obtenir le token Netlify
```bash
# Si vous êtes déjà connecté
netlify token

# Si vous n'êtes pas connecté
netlify login
netlify token
```

### Vérifier le site ID
```bash
netlify status
# Ou
netlify sites:list
```

### Tester Supabase
```bash
# Remplacez par votre URL
curl https://xxxxxxxx.supabase.co/rest/v1/
```

## Mise à jour des secrets

Si vous devez mettre à jour un secret :

1. **Allez sur** : https://github.com/dezahiulrich-sys/DezAI/settings/secrets/actions
2. **Trouvez** le secret à mettre à jour
3. **Cliquez sur l'icône d'édition** (crayon)
4. **Mettez à jour** la valeur
5. **Cliquez sur "Update secret"**

## Sécurité

### Bonnes pratiques :
1. **Ne jamais** commit les secrets dans le code
2. **Utiliser toujours** les secrets GitHub
3. **Régénérer** les tokens régulièrement
4. **Limiter** les permissions des tokens

### Tokens à garder secrets :
- ✅ **NETLIFY_AUTH_TOKEN** : Jamais dans le code
- ✅ **VITE_SUPABASE_ANON_KEY** : OK côté client
- ❌ **SUPABASE_SERVICE_ROLE_KEY** : Jamais côté client
- ❌ **Database passwords** : Jamais dans le code

## URLs importantes

- **Secrets GitHub** : https://github.com/dezahiulrich-sys/DezAI/settings/secrets/actions
- **Actions GitHub** : https://github.com/dezahiulrich-sys/DezAI/actions
- **Netlify Tokens** : https://app.netlify.com/user/applications/personal
- **Supabase API** : https://supabase.com/dashboard/project/_/settings/api

## Script d'initialisation (optionnel)

Si vous avez beaucoup de projets, créez un script :

```bash
#!/bin/bash
# setup-secrets.sh

echo "Setting up GitHub secrets..."

# Netlify
read -p "Enter NETLIFY_AUTH_TOKEN: " netlify_token
read -p "Enter NETLIFY_SITE_ID: " site_id

# Supabase
read -p "Enter VITE_SUPABASE_URL: " supabase_url
read -p "Enter VITE_SUPABASE_ANON_KEY: " supabase_key

echo "Secrets collected. Add them manually to GitHub."
echo "NETLIFY_AUTH_TOKEN: $netlify_token"
echo "NETLIFY_SITE_ID: $site_id"
echo "VITE_SUPABASE_URL: $supabase_url"
echo "VITE_SUPABASE_ANON_KEY: $supabase_key"
```

**Note** : Exécutez ce script localement, ne le commit pas.