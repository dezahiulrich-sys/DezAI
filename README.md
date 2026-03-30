# DezAI

![DezAI Banner](https://img.shields.io/badge/DezAI-FF6A00?style=for-the-badge&logo=spotify&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 🎯 Overview

**SoundForge AI** is a professional SaaS audio analysis tool for music producers. Upload any audio file and get:

- ✅ BPM Detection
- ✅ Key/Tonalité Analysis
- ✅ Energy Analysis
- ✅ Genre Classification
- ✅ Interactive Waveform
- ✅ Stem Separation (Vocals, Drums, Bass, Other)
- ✅ Comprehensive Drum & Rhythm Analysis
- ✅ MIDI Generation for all instruments
- ✅ FL Studio Compatible MIDI Files
- ✅ Groove Intelligence (Swing, Subdivisions)
- ✅ ZIP Download

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Netlify)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   React     │  │ Framer Motion│  │   Web Audio API  │ │
│  │   + Vite    │  │  Animations │  │   Analysis      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└──────────────────────────┬────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Supabase)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Auth      │  │  PostgreSQL │  │   Edge Functions │ │
│  │  (Email)    │  │  Database   │  │   (Deno)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Storage   │  │  Demucs     │  │   Essentia.js    │ │
│  │   Buckets   │  │  (Stems)    │  │   (Analysis)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Orange | `#FF6A00` | Main brand color |
| Orange Light | `#FF8F12` | Hover states |
| Orange Dark | `#E05500` | Active states |
| Secondary Green | `#00B499` | Accents |
| Green Light | `#00FFCA` | Highlights |
| Accent Green | `#00FF88` | Success states |

### Backgrounds
- Dark: `#0A0A0F`
- Card: `rgba(20, 20, 30, 0.8)`
- Glass: `rgba(255, 255, 255, 0.05)`
- Elevated: `rgba(30, 30, 45, 0.9)`

### Typography
- **Font**: Inter (Google Fonts)
- **Mono**: JetBrains Mono
- **Weights**: 300, 400, 500, 600, 700, 800

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase CLI
- Netlify CLI

### 1. Clone & Install

```bash
# Navigate to project
cd DezAI

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (if using Python service)
cd ../backend/demucs_service
pip install -r requirements.txt
```

### 2. Configure Supabase

```bash
# Login to Supabase
npx supabase login

# Link to your project
cd ../backend/supabase
npx supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
npx supabase db push

# Apply storage configurations
npx supabase db execute --file storage.sql
```

### 3. Environment Variables

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROCESS_AUDIO_URL=https://your-project.supabase.co/functions/v1/process-audio
```

### 4. Run Development

```bash
# Terminal 1: Start Supabase locally
cd backend/supabase
npx supabase start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 5. Deploy to Netlify

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## 📁 Project Structure

```
DezAI/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Main application
│   │   ├── App.css             # App-specific styles
│   │   ├── index.css           # Global design system
│   │   ├── main.tsx           # Entry point
│   │   ├── lib/
│   │   │   ├── supabaseClient.ts   # Supabase client
│   │   │   └── analysisApi.ts      # Analysis API
│   │   └── components/         # React components
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── supabase/
│   │   ├── config.toml         # Supabase config
│   │   ├── schema.sql          # Database schema
│   │   ├── storage.sql         # Storage buckets
│   │   └── functions/
│   │       └── process-audio/  # Edge function
│   │           └── index.ts
│   │
│   └── demucs_service/         # Python stem separation
│       ├── main.py
│       ├── Dockerfile
│       └── requirements.txt
│
└── README.md
```

---

## 🎵 Features

### Audio Upload & Processing
- Drag & drop or click to upload
- Support for MP3, WAV, FLAC, AIFF, OGG
- Real-time processing progress indicator
- Automatic analysis starts after upload

### Analysis Results
- **BPM Detection**: High accuracy tempo detection
- **Key Analysis**: Tonalité detection (C, C#, D, etc.)
- **Duration**: Track length in seconds
- **Energy**: Intensity percentage (0-100%)
- **Genre**: Classification (Hip Hop, Trap, R&B, etc.)
- **Style**: Sub-style (Boom Bap, Trap, Drill, etc.)
- **Swing**: Swing percentage
- **Subdivision**: 1/16, 1/8, 1/4, Triplets
- **Groove**: Straight, Swing, Shuffle patterns

### Drum Analysis
Detects presence and intensity of:
- 🥁 Kick Drum
- 🥁 Snare
- 🎩 Hi-Hat (Closed/Open)
- 👏 Clap
- 🔮 Shaker
- 🥁 Percussion
- 🎸 Crash/Cymbals
- 🎸 808 Sub-bass (if present)

### Stem Mixer
- Volume sliders for each stem
- Mute (M) button per channel
- Solo (S) button per channel
- Real-time audio mixing in browser

### MIDI Generation
Generates FL Studio-compatible MIDI files:
- 🎹 Melody MIDI
- 🎸 Bass MIDI
- 🎵 Chords MIDI
- 🥁 Drums MIDI (combined)
- 🥁 Kick MIDI (individual)
- 🥁 Snare MIDI (individual)
- 🎩 Hi-Hat MIDI (individual)
- 🔮 Shaker MIDI (individual)

Features:
- BPM-synced timing
- Humanization (velocity + timing variations)
- Hi-hat rolls
- DAW-ready (drag & drop to FL Studio)

### Groove Intelligence
- Swing detection
- Subdivision analysis
- Style recognition (Trap, Drill, Boom Bap, etc.)
- Rhythmic structure mapping

---

## 🧩 Components

### SplashScreen
Animated loading screen with:
- DezAI logo with SVG animation
- Letter-by-letter title reveal
- Orange glow effects
- Grid background
- Loading dots indicator

### UploadZone
- Drag & drop support
- Visual feedback on hover
- File type validation
- Format badges display

### AudioPlayer (DAW Style)
- Play/Pause controls
- Timeline with scrubbing
- Waveform visualization
- Time display (current / total)
- Multi-track synchronization

### StemMixer
- 4 channel strips (Vocals, Drums, Bass, Other)
- Vertical volume faders
- Mute/Solo buttons
- Real-time audio mixing

### DrumGrid
- 8-item grid display
- Intensity percentage per element
- 808 indicator

### MidiPanel
- List of generated MIDI tracks
- Preview button
- Download button per track
- BPM display

### DownloadSection
- Download All (ZIP) button
- Progress indicator
- Shareable links

### HistoryPanel
- Last 10 analyses stored
- Quick reload functionality
- Metadata display (date, BPM, key)

---

## 🔧 API Reference

### Supabase Edge Function: process-audio

**Endpoint:**
```
POST /functions/v1/process-audio
```

**Request:**
```json
{
  "filePath": "audio/user-id/timestamp-filename.mp3",
  "userId": "uuid-of-user"
}
```

**Response:**
```json
{
  "id": "uuid",
  "analysis": {
    "bpm": 140,
    "key": "Cm",
    "duration": 180.5,
    "energy": 75,
    "genre": "Hip Hop",
    "style": "Trap",
    "swing": 45,
    "subdivision": "1/16",
    "groove": "Swing",
    "drums": {
      "kick": 85,
      "snare": 78,
      "hihat": 92,
      "clap": 65,
      "shaker": 45,
      "perc": 30,
      "crash": 15,
      "type808": true
    }
  },
  "stems": {
    "vocals": "",
    "drums": "",
    "bass": "",
    "other": ""
  },
  "midi": {
    "melody": "{...}",
    "bass": "{...}",
    "chords": "{...}",
    "drums": "{...}",
    "kick": "{...}",
    "snare": "{...}",
    "hihat": "{...}",
    "shaker": "{...}"
  }
}
```

---

## 🗄️ Database Schema

### Table: analyses
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_id UUID REFERENCES files(id),
  bpm INTEGER,
  key TEXT,
  duration NUMERIC,
  energy NUMERIC,
  genre TEXT,
  style TEXT,
  rhythm JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: files
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  path TEXT,
  bucket TEXT,
  file_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Buckets
| Bucket | Purpose | Max Size |
|--------|---------|----------|
| audio | User uploads | 50MB |
| stems | Separated tracks | 100MB |
| midi | Generated MIDI | 10MB |
| exports | ZIP downloads | 200MB |

---

## 🎹 MIDI File Format

### Structure
```
MIDI Track Name: [Track Type]
BPM: [value]
Time Signature: [4/4]
Duration: [seconds]

Notes:
- Each note includes: time, pitch, velocity, duration
- Humanization applied to timing (±5ms) and velocity (±10)
- Quantized to grid based on subdivision
```

### Example (Kick MIDI)
```
MIDI Track Name: Kick
BPM: 140
Time Signature: 4/4

Notes:
0.000s: Pitch 36 (C1), Velocity 127, Duration 0.5s
0.429s: Pitch 36, Velocity 125, Duration 0.5s
0.857s: Pitch 36, Velocity 127, Duration 0.5s
...
```

---

## 🎨 DezAI Brand Guidelines

### Logo
The logo must be written exactly as:
```
DezAI
```

❌ **Invalid variations:**
- DEZAI
- Dezai
- deZAI
- dezai

### Colors
- Orange: `#FF6A00`
- Green: `#00B499`
- White for contrast

---

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📦 Dependencies

### Frontend
- react ^18.2.0
- react-dom ^18.2.0
- framer-motion ^11.0.0
- @supabase/supabase-js ^2.0.0
- meyda ^5.4.0 (audio features)
- vite ^5.3.0

### Backend (Demucs Service)
- demucs
- librosa
- numpy
- fastapi
- uvicorn

---

## 🚀 Deployment

### Frontend (Netlify)
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

### Backend (Supabase)
1. Deploy Edge Functions:
```bash
cd backend/supabase/functions
npx supabase functions deploy process-audio
```

2. Set secrets:
```bash
npx supabase secrets set SUPABASE_URL=https://xxx.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Demucs Service (Optional)
1. Build Docker image:
```bash
cd backend/demucs_service
docker build -t soundforge-demucs .
```

2. Deploy to container service (Railway, Fly.io, etc.)

---

## 🔒 Security

- All API routes protected by Supabase auth
- Row Level Security (RLS) enabled
- File uploads limited to audio types
- Storage policies enforce user ownership
- No secrets exposed to frontend
- Edge Functions use service role for elevated access

---

## 📈 Future Enhancements

- [ ] Real-time stem separation via Demucs
- [ ] Advanced chord detection
- [ ] Melody extraction with Basic Pitch
- [ ] A/B comparison between stems
- [ ] Collaborative features
- [ ] Mobile app (React Native)
- [ ] Batch processing
- [ ] Custom preset saving

---

## 📄 License

© 2024 DezAI. All rights reserved.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Documentation**: [Wiki](wiki)
- **Issues**: [GitHub Issues](issues)
- **Email**: support@dezai.app

---

<div align="center">
  <p>
    Made with ❤️ by <strong>DezAI</strong>
  </p>
  <p>
    <a href="https://dezai.app">Website</a> •
    <a href="https://github.com/dezai">GitHub</a> •
    <a href="https://twitter.com/dezai">Twitter</a>
  </p>
</div>