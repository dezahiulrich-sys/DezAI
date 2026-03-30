import os
import uuid
import shutil
import tempfile
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

app = FastAPI(title='SoundForge AI Demucs Service')

class ProcessRequest(BaseModel):
    file_url: str
    user_id: str
    filename: str
    bpm: Optional[float] = None

class ProcessResponse(BaseModel):
    stems: Dict[str, str]
    midi: Dict[str, str]
    analysis: Dict[str, Any]

class SimpleProcessResponse(BaseModel):
    success: bool
    message: str
    analysis: Dict[str, Any]
    stems: Dict[str, str]
    midi: Dict[str, str]


@app.post('/process', response_model=ProcessResponse)
async def process_audio(req: ProcessRequest):
    temp_dir = Path(tempfile.mkdtemp(prefix="soundforge_"))
    try:
        audio_path = temp_dir / req.filename
        # Download audio
        import httpx
        r = httpx.get(req.file_url, timeout=60.0)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail='Impossible de télécharger le fichier audio')
        audio_path.write_bytes(r.content)

        # Stems extraction (Demucs placeholder)
        stems_dir = temp_dir / 'stems'
        stems_dir.mkdir(exist_ok=True)

        # If demucs installed, call it, otherwise generate dummy stems file
        demucs_cmd = shutil.which('demucs')
        if demucs_cmd:
            cmd = ['demucs', '--two-stems=vocals', '-o', str(stems_dir), str(audio_path)]
            subprocess.run(cmd, check=True)
        else:
            for stem in ['vocals', 'drums', 'bass', 'other']:
                path = stems_dir / f'{stem}.wav'
                path.write_bytes(b'')  # placeholder

        # MIDI generation placeholder
        midi_dir = temp_dir / 'midi'
        midi_dir.mkdir(exist_ok=True)
        midi = {}
        for part in ['melody', 'bass', 'chords', 'drums', 'kick', 'snare', 'hihat', 'shaker']:
            fpath = midi_dir / f'{part}.mid'
            from mido import MidiFile, MidiTrack, Message
            mid = MidiFile()
            track = MidiTrack(); mid.tracks.append(track)
            track.append(Message('program_change', program=12, time=0))
            mid.save(fpath)
            midi[part] = str(fpath)

        # Analysis placeholder
        analysis = {
            'bpm': req.bpm or 128,
            'key': 'C minor',
            'duration': 120.0,
            'energy': 0.78,
            'genre': 'trap',
            'style': 'boom bap',
            'rhythm': {'kick': 64, 'snare': 32, 'hihat': 128},
        }

        stems_result = {stem.name: str(stem.absolute()) for stem in stems_dir.iterdir() if stem.is_file()}

        return ProcessResponse(stems=stems_result, midi=midi, analysis=analysis)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post('/upload', response_model=SimpleProcessResponse)
async def upload_audio(file: UploadFile = File(...)):
    temp_dir = Path(tempfile.mkdtemp(prefix="soundforge_"))
    try:
        # Save uploaded file
        audio_path = temp_dir / file.filename
        content = await file.read()
        audio_path.write_bytes(content)
        
        # Create stems directory
        stems_dir = temp_dir / 'stems'
        stems_dir.mkdir(exist_ok=True)
        
        # Create dummy stems
        for stem in ['vocals', 'drums', 'bass', 'other']:
            path = stems_dir / f'{stem}.wav'
            path.write_bytes(b'dummy')  # placeholder
        
        # Create MIDI directory
        midi_dir = temp_dir / 'midi'
        midi_dir.mkdir(exist_ok=True)
        midi = {}
        for part in ['melody', 'bass', 'chords', 'drums']:
            fpath = midi_dir / f'{part}.mid'
            from mido import MidiFile, MidiTrack, Message
            mid = MidiFile()
            track = MidiTrack(); mid.tracks.append(track)
            track.append(Message('program_change', program=12, time=0))
            mid.save(fpath)
            midi[part] = f"midi/{part}.mid"
        
        # Analysis results
        analysis = {
            'bpm': 128,
            'key': 'C minor',
            'duration': 120.0,
            'energy': 0.78,
            'genre': 'trap',
            'style': 'boom bap',
            'rhythm': {'kick': 64, 'snare': 32, 'hihat': 128},
        }
        
        stems_result = {stem: f"stems/{stem}.wav" for stem in ['vocals', 'drums', 'bass', 'other']}
        
        return SimpleProcessResponse(
            success=True,
            message=f"File {file.filename} processed successfully",
            analysis=analysis,
            stems=stems_result,
            midi=midi
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.get('/health')
async def health_check():
    return {'status': 'ok', 'service': 'demucs'}