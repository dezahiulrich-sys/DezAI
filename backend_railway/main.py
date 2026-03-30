"""
DezAI Backend for Railway - FastAPI + Demucs 8 Stems
Optimized for cloud deployment on Railway.app
"""

import os
import uuid
import shutil
import tempfile
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiofiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DezAI Audio Separation API",
    description="FastAPI backend for audio stem separation using Demucs 8 stems",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://dezai-audio-analysis.netlify.app",
        "https://*.netlify.app",
        "https://*.railway.app",
        # Add your production frontend URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ProcessingStatus(BaseModel):
    task_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: float  # 0.0 to 1.0
    message: str
    created_at: datetime
    updated_at: datetime
    result_urls: Optional[Dict[str, str]] = None
    error: Optional[str] = None

class UploadResponse(BaseModel):
    task_id: str
    message: str
    upload_url: str

# Global variables for task tracking
processing_tasks: Dict[str, ProcessingStatus] = {}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.flac', '.aiff', '.ogg', '.m4a', '.aac'}
STEM_NAMES = ['vocals', 'drums', 'bass', 'guitar', 'piano', 'synth', 'strings', 'other']

# Create necessary directories
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# Mount static files for serving processed files
app.mount("/processed", StaticFiles(directory="processed"), name="processed")

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("DezAI Backend starting up...")
    logger.info(f"Upload directory: {UPLOAD_DIR.absolute()}")
    logger.info(f"Processed directory: {PROCESSED_DIR.absolute()}")
    
    # Clean up old files on startup
    await cleanup_old_files()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DezAI Audio Separation API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "upload": "/upload",
            "status": "/status/{task_id}",
            "download": "/download/{task_id}/{stem_name}",
            "docs": "/docs"
        },
        "stems_supported": STEM_NAMES
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "dezai-audio-separation",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development")
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Audio file to process (MP3, WAV, FLAC, AIFF, OGG, M4A, AAC)")
):
    """
    Upload an audio file for stem separation.
    
    Returns a task ID that can be used to check processing status.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Create task directory
    task_dir = UPLOAD_DIR / task_id
    task_dir.mkdir(exist_ok=True)
    
    # Save uploaded file
    file_path = task_dir / f"original{file_ext}"
    
    try:
        # Read file in chunks to handle large files
        file_size = 0
        async with aiofiles.open(file_path, 'wb') as f:
            while chunk := await file.read(8192):  # 8KB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File too large. Maximum size is 100MB")
                await f.write(chunk)
        
        logger.info(f"File uploaded: {file.filename} ({file_size} bytes) for task {task_id}")
        
        # Create processing task
        processing_tasks[task_id] = ProcessingStatus(
            task_id=task_id,
            status="pending",
            progress=0.0,
            message="File uploaded successfully, starting processing...",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Start background processing
        background_tasks.add_task(process_audio_task, task_id, file_path)
        
        return UploadResponse(
            task_id=task_id,
            message="File uploaded successfully. Processing started.",
            upload_url=f"/status/{task_id}"
        )
        
    except Exception as e:
        logger.error(f"Upload error for task {task_id}: {str(e)}")
        # Clean up on error
        if task_dir.exists():
            shutil.rmtree(task_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/status/{task_id}", response_model=ProcessingStatus)
async def get_processing_status(task_id: str):
    """Get the status of a processing task"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return processing_tasks[task_id]

@app.get("/download/{task_id}/{stem_name}")
async def download_stem(task_id: str, stem_name: str):
    """Download a processed stem file"""
    if stem_name not in STEM_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid stem name. Must be one of: {', '.join(STEM_NAMES)}")
    
    stem_path = PROCESSED_DIR / task_id / f"{stem_name}.wav"
    
    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem file not found. It may still be processing or has expired.")
    
    return FileResponse(
        path=stem_path,
        filename=f"{stem_name}.wav",
        media_type="audio/wav"
    )

@app.get("/download-all/{task_id}")
async def download_all_stems(task_id: str):
    """Download all stems as a ZIP archive"""
    task_dir = PROCESSED_DIR / task_id
    
    if not task_dir.exists():
        raise HTTPException(status_code=404, detail="Task files not found")
    
    # Create ZIP file
    import zipfile
    zip_path = task_dir / "stems.zip"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for stem in STEM_NAMES:
            stem_file = task_dir / f"{stem}.wav"
            if stem_file.exists():
                zipf.write(stem_file, f"{stem}.wav")
    
    return FileResponse(
        path=zip_path,
        filename=f"dezai_stems_{task_id}.zip",
        media_type="application/zip"
    )

async def process_audio_task(task_id: str, audio_path: Path):
    """Background task to process audio with Demucs"""
    task_dir = UPLOAD_DIR / task_id
    output_dir = PROCESSED_DIR / task_id
    output_dir.mkdir(exist_ok=True)
    
    try:
        # Update task status
        processing_tasks[task_id].status = "processing"
        processing_tasks[task_id].progress = 0.1
        processing_tasks[task_id].message = "Initializing Demucs..."
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Import Demucs (lazy import to avoid startup overhead)
        try:
            from demucs import pretrained
            from demucs.apply import apply_model
            import torch
            import torchaudio
        except ImportError as e:
            raise ImportError(f"Demucs not available: {str(e)}. Please install: pip install demucs torchaudio")
        
        # Check for GPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        processing_tasks[task_id].progress = 0.2
        processing_tasks[task_id].message = f"Loading Demucs model on {device}..."
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Load Demucs model (8 stems version)
        model = pretrained.get_model('htdemucs')
        model.to(device)
        
        processing_tasks[task_id].progress = 0.3
        processing_tasks[task_id].message = "Loading audio file..."
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Load audio file
        waveform, sample_rate = torchaudio.load(str(audio_path))
        
        # Convert to mono if stereo (Demucs expects specific channel format)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        
        processing_tasks[task_id].progress = 0.4
        processing_tasks[task_id].message = "Separating audio stems..."
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Apply Demucs model
        with torch.no_grad():
            sources = apply_model(model, waveform[None], device=device, progress=True)[0]
        
        processing_tasks[task_id].progress = 0.8
        processing_tasks[task_id].message = "Saving separated stems..."
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Save each stem
        result_urls = {}
        for i, stem_name in enumerate(STEM_NAMES):
            if i < len(sources):  # Make sure we have enough sources
                stem_audio = sources[i].cpu()
                stem_path = output_dir / f"{stem_name}.wav"
                torchaudio.save(str(stem_path), stem_audio, sample_rate)
                result_urls[stem_name] = f"/download/{task_id}/{stem_name}"
        
        processing_tasks[task_id].progress = 1.0
        processing_tasks[task_id].status = "completed"
        processing_tasks[task_id].message = "Processing completed successfully!"
        processing_tasks[task_id].result_urls = result_urls
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        logger.info(f"Task {task_id} completed successfully")
        
        # Schedule cleanup of upload directory
        asyncio.create_task(cleanup_task_directory(task_dir))
        
    except Exception as e:
        logger.error(f"Processing error for task {task_id}: {str(e)}")
        
        processing_tasks[task_id].status = "failed"
        processing_tasks[task_id].progress = 0.0
        processing_tasks[task_id].message = f"Processing failed: {str(e)}"
        processing_tasks[task_id].error = str(e)
        processing_tasks[task_id].updated_at = datetime.utcnow()
        
        # Clean up on error
        if task_dir.exists():
            shutil.rmtree(task_dir, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)

async def cleanup_task_directory(task_dir: Path):
    """Clean up task directory after processing"""
    await asyncio.sleep(300)  # Wait 5 minutes before cleanup
    if task_dir.exists():
        shutil.rmtree(task_dir, ignore_errors=True)
        logger.info(f"Cleaned up task directory: {task_dir}")

async def cleanup_old_files():
    """Clean up old files on startup"""
    max_age_hours = 24  # Keep files for 24 hours
    
    for dir_path in [UPLOAD_DIR, PROCESSED_DIR]:
        if not dir_path.exists():
            continue
            
        for item in dir_path.iterdir():
            if item.is_dir():
                try:
                    # Check if directory is old
                    dir_age = datetime.utcnow() - datetime.fromtimestamp(item.stat().st_mtime)
                    if dir_age.total_seconds() > max_age_hours * 3600:
                        shutil.rmtree(item, ignore_errors=True)
                        logger.info(f"Cleaned up old directory: {item}")
                except Exception as e:
                    logger.warning(f"Failed to clean up {item}: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)