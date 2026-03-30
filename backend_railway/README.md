# DezAI Backend - FastAPI + Demucs 8 Stems

Backend optimisé pour Railway.app qui sépare les fichiers audio en 8 stems utilisant Demucs.

## 🎯 Fonctionnalités

- **Upload de fichiers audio** : MP3, WAV, FLAC, AIFF, OGG, M4A, AAC (jusqu'à 100MB)
- **Séparation 8 stems** : vocals, drums, bass, guitar, piano, synth, strings, other
- **Traitement asynchrone** : Background tasks avec suivi de progression
- **Gestion des fichiers volumineux** : Streaming et nettoyage automatique
- **API REST complète** : Documentation Swagger intégrée
- **Optimisé pour Railway** : Configuration cloud-ready

## 🏗️ Architecture

```
DezAI Backend (Railway)
├── FastAPI (Python 3.11+)
├── Demucs (htdemucs 8 stems)
├── PyTorch + TorchAudio
├── Async file processing
└── Automatic cleanup
```

## 🚀 Déploiement sur Railway

### Méthode 1 : Déploiement direct (recommandé)

1. **Installez Railway CLI** :
   ```bash
   npm i -g @railway/cli
   ```

2. **Connectez-vous** :
   ```bash
   railway login
   ```

3. **Initialisez le projet** :
   ```bash
   railway init
   ```

4. **Déployez** :
   ```bash
   railway up
   ```

### Méthode 2 : Via GitHub

1. **Poussez le code sur GitHub**
2. **Allez sur [Railway.app](https://railway.app)**
3. **Cliquez "New Project" → "Deploy from GitHub repo"**
4. **Sélectionnez votre dépôt**
5. **Railway détectera automatiquement la configuration**

### Méthode 3 : Via Railway Dashboard

1. **Connectez-vous à [Railway.app](https://railway.app)**
2. **Cliquez "New Project"**
3. **Choisissez "Empty Project"**
4. **Ajoutez un service "GitHub Repo"**
5. **Sélectionnez votre dépôt**

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `PORT` | Port du serveur | `8000` |
| `LOG_LEVEL` | Niveau de logging | `INFO` |
| `MAX_FILE_SIZE` | Taille max fichier (bytes) | `104857600` (100MB) |
| `FILE_RETENTION_HOURS` | Durée de rétention fichiers | `24` |

### Ressources Railway

**Plan recommandé** :
- **CPU** : 2-4 vCPUs
- **RAM** : 4-8GB (minimum 2GB pour Demucs)
- **Stockage** : 1-2GB (pour modèles + fichiers temporaires)
- **GPU** : Optionnel mais recommandé (accélère 10x)

## 📡 API Endpoints

### `GET /`
Informations sur l'API et endpoints disponibles.

### `GET /health`
Health check du service.

### `POST /upload`
Upload un fichier audio pour traitement.

**Request** :
```bash
curl -X POST \
  -F "file=@audio.mp3" \
  https://your-railway-url.railway.app/upload
```

**Response** :
```json
{
  "task_id": "uuid-1234-5678",
  "message": "File uploaded successfully. Processing started.",
  "upload_url": "/status/uuid-1234-5678"
}
```

### `GET /status/{task_id}`
Vérifie le statut du traitement.

**Response** :
```json
{
  "task_id": "uuid-1234-5678",
  "status": "processing",
  "progress": 0.5,
  "message": "Separating audio stems...",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:30Z",
  "result_urls": {
    "vocals": "/download/uuid-1234-5678/vocals",
    "drums": "/download/uuid-1234-5678/drums",
    "bass": "/download/uuid-1234-5678/bass",
    "guitar": "/download/uuid-1234-5678/guitar",
    "piano": "/download/uuid-1234-5678/piano",
    "synth": "/download/uuid-1234-5678/synth",
    "strings": "/download/uuid-1234-5678/strings",
    "other": "/download/uuid-123-5678/other"
  }
}
```

### `GET /download/{task_id}/{stem_name}`
Télécharge un stem spécifique.

### `GET /download-all/{task_id}`
Télécharge tous les stems en ZIP.

## 🔧 Développement local

### Prérequis
- Python 3.11+
- pip
- Git

### Installation

1. **Clonez le dépôt** :
   ```bash
   git clone https://github.com/yourusername/dezai-backend.git
   cd dezai-backend
   ```

2. **Créez un environnement virtuel** :
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate  # Windows
   ```

3. **Installez les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

4. **Démarrez le serveur** :
   ```bash
   python main.py
   ```

5. **Accédez à l'API** :
   - API : http://localhost:8000
   - Documentation : http://localhost:8000/docs

### Tests

```bash
# Run tests
pytest tests/

# Test avec curl
curl -X POST -F "file=@test_audio.mp3" http://localhost:8000/upload
```

## 🎨 Intégration avec Frontend React

### Exemple de composant React

```jsx
import React, { useState } from 'react';

const AudioUploader = () => {
  const [file, setFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://your-railway-url.railway.app';

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setTaskId(data.task_id);
    pollStatus(data.task_id);
  };

  const pollStatus = async (taskId) => {
    const interval = setInterval(async () => {
      const response = await fetch(`${API_URL}/status/${taskId}`);
      const data = await response.json();
      
      setStatus(data);
      
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      
      {status && (
        <div>
          <p>Status: {status.status}</p>
          <p>Progress: {(status.progress * 100).toFixed(1)}%</p>
          <p>Message: {status.message}</p>
          
          {status.status === 'completed' && (
            <div>
              <h3>Stems disponibles :</h3>
              {Object.entries(status.result_urls).map(([stem, url]) => (
                <a key={stem} href={`${API_URL}${url}`} download>
                  Télécharger {stem}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
```

### Variables d'environnement frontend

```env
REACT_APP_API_URL=https://your-railway-url.railway.app
REACT_APP_MAX_FILE_SIZE=104857600
```

## 📊 Performance

### Temps de traitement estimés

| Durée audio | CPU (4 vCPUs) | GPU (NVIDIA T4) |
|-------------|---------------|-----------------|
| 3 minutes | 2-3 minutes | 20-30 secondes |
| 5 minutes | 3-4 minutes | 30-45 secondes |
| 10 minutes | 6-8 minutes | 1-2 minutes |

### Consommation mémoire

- **Modèle Demucs** : ~1.5GB
- **Traitement actif** : ~2-3GB
- **Fichiers temporaires** : 2x taille fichier original

## 🛠️ Dépannage

### Problèmes courants

1. **"Out of memory"** :
   - Augmentez la RAM sur Railway
   - Réduisez `MAX_WORKERS` à 1
   - Limitez la taille des fichiers

2. **Traitement trop lent** :
   - Passez au tier GPU sur Railway
   - Optimisez la taille des fichiers
   - Utilisez des formats compressés (MP3)

3. **"Demucs not available"** :
   - Vérifiez l'installation de PyTorch
   - Réinstallez les dépendances
   - Vérifiez la compatibilité CUDA

### Logs Railway

```bash
# Voir les logs
railway logs

# Logs en temps réel
railway logs -f

# Logs spécifiques au service
railway logs dezai-backend
```

## 🔒 Sécurité

### Recommandations

1. **Rate limiting** : Implémentez un rate limiter
2. **Authentification** : Ajoutez JWT tokens
3. **CORS** : Limitez les origines autorisées
4. **Validation** : Validez tous les inputs
5. **Nettoyage** : Supprimez les fichiers temporaires

### Exemple de middleware d'authentification

```python
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Vérifiez le token JWT
    if not valid_token(token):
        raise HTTPException(status_code=401, detail="Invalid token")
    return token
```

## 📈 Monitoring

### Métriques à surveiller

1. **CPU usage** : Doit rester < 80%
2. **Memory usage** : Doit rester < 90%
3. **Disk space** : Nettoyage automatique
4. **Response time** : < 30s pour upload
5. **Error rate** : < 1%

### Intégrations

- **Railway Metrics** : Dashboard intégré
- **Datadog** : Monitoring avancé
- **Sentry** : Error tracking
- **Logtail** : Log management

## 🔄 Mises à jour

### Mettre à jour les dépendances

```bash
# Mettre à jour pip
pip install --upgrade pip

# Mettre à jour les packages
pip install --upgrade -r requirements.txt

# Générer un nouveau requirements.txt
pip freeze > requirements.txt
```

### Mettre à jour Demucs

```bash
pip install --upgrade demucs torch torchaudio
```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature
3. Commitez vos changements
4. Push vers la branche
5. Ouvrez une Pull Request

## 📞 Support

- **Issues GitHub** : [github.com/yourusername/dezai-backend/issues](https://github.com/yourusername/dezai-backend/issues)
- **Email** : support@dezai.com
- **Discord** : [discord.gg/dezai](https://discord.gg/dezai)

---

**Déployé avec ❤️ sur Railway** | [Documentation Railway](https://docs.railway.app) | [Documentation Demucs](https://github.com/facebookresearch/demucs)