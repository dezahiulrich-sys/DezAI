import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [step, setStep] = useState<'splash' | 'app'>('splash');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setStep('app'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      handleFileSelect(file);
    } else {
      alert('Please select an audio file (MP3, WAV, FLAC, AIFF, OGG)');
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to Demucs service using the new upload endpoint
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      alert(`File "${file.name}" processed successfully!\nBPM: ${result.analysis?.bpm || 'N/A'}\nKey: ${result.analysis?.key || 'N/A'}`);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to simulation if API fails
      setTimeout(() => {
        alert(`File "${file.name}" processed with simulated results!\nBPM: 128\nKey: C minor`);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container">
      <AnimatePresence>
        {step === 'splash' && (
          <motion.div
            className="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="splash-bg-effects">
              <div className="orb orb-1" />
              <div className="orb orb-2" />
              <div className="grid-lines" />
            </div>

            <motion.div
              className="logo-container"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 1.2 }}
            >
              <svg viewBox="0 0 200 200" width="160" height="160" className="logo-svg">
                <defs>
                  <linearGradient id="orange-grad-splash" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffcc66" />
                    <stop offset="50%" stopColor="#ff6a00" />
                    <stop offset="100%" stopColor="#ff8f12" />
                  </linearGradient>
                  <linearGradient id="green-grad-splash" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ffca" />
                    <stop offset="100%" stopColor="#00b499" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                <motion.path
                  d="M40 30 L40 170 Q40 195 65 195 L125 195 Q165 195 165 150 L165 50 Q165 15 120 15 L58 15 Q40 15 40 30 Z"
                  fill="url(#orange-grad-splash)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
                  filter="url(#glow)"
                />
                
                <motion.path
                  d="M62 45 C95 45 115 75 115 105 C115 135 95 165 62 165"
                  fill="none"
                  stroke="url(#green-grad-splash)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeInOut', delay: 0.8 }}
                />
              </svg>
            </motion.div>

            <motion.h1 className="splash-title">
              {'DezAI'.split('').map((letter, i) => (
                <motion.span
                  key={i}
                  className="title-letter"
                  initial={{ opacity: 0, y: 20, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, ease: 'backOut', delay: 0.3 + i * 0.15 }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>

            <motion.div
              className="splash-sub"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '80px' }}
              transition={{ duration: 0.5, delay: 1.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'app' && (
        <main className="main">
          {/* Header with Logo */}
          <header>
            <div className="header-container">
              <div className="header-left">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  DezAI
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Advanced Audio Analysis & MIDI Generation
                </motion.p>
              </div>
              <motion.div 
                className="header-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <svg viewBox="0 0 200 200" width="60" height="60" className="dezai-logo">
                  <defs>
                    <linearGradient id="logo-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffcc66" />
                      <stop offset="50%" stopColor="#ff6a00" />
                      <stop offset="100%" stopColor="#ff8f12" />
                    </linearGradient>
                    <linearGradient id="logo-green" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00ffca" />
                      <stop offset="100%" stopColor="#00b499" />
                    </linearGradient>
                    <filter id="logo-glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <path
                    d="M40 30 L40 170 Q40 195 65 195 L125 195 Q165 195 165 150 L165 50 Q165 15 120 15 L58 15 Q40 15 40 30 Z"
                    fill="url(#logo-orange)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    filter="url(#logo-glow)"
                  />
                  
                  <path
                    d="M62 45 C95 45 115 75 115 105 C115 135 95 165 62 165"
                    fill="none"
                    stroke="url(#logo-green)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  
                  <path
                    className="logo-pulse"
                    d="M66 80 L78 95 L90 70 L102 100 L114 75 L126 95"
                    fill="none"
                    stroke="rgba(0,255,200,0.9)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>
          </header>

          {/* Upload Zone */}
          <motion.div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            style={{ cursor: 'pointer' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            
            <h3>Drop your audio file here</h3>
            <p>or click to browse from your computer</p>
            
            <div className="formats">
              <span className="format-badge">MP3</span>
              <span className="format-badge">WAV</span>
              <span className="format-badge">FLAC</span>
              <span className="format-badge">AIFF</span>
              <span className="format-badge">OGG</span>
            </div>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 106, 0, 0.1)', borderRadius: '8px' }}
              >
                <p style={{ margin: 0, color: '#00FFCA' }}>
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: '24px', textAlign: 'center' }}
            >
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '12px', color: '#00FFCA' }}>
                Processing audio file with DezAI...
              </p>
            </motion.div>
          )}

          {/* Demo Content */}
          <div className="card" style={{ marginTop: '32px' }}>
            <h2>🎵 Features</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>✅ BPM Detection</li>
              <li>✅ Key/Tonalité Analysis</li>
              <li>✅ Stem Separation (Vocals, Drums, Bass, Other)</li>
              <li>✅ MIDI Generation for all instruments</li>
              <li>✅ FL Studio Compatible MIDI Files</li>
              <li>✅ Groove Intelligence (Swing, Subdivisions)</li>
            </ul>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h2>🚀 Quick Start</h2>
            <p>Upload an audio file to begin analysis. Supported formats: MP3, WAV, FLAC, AIFF, OGG.</p>
            <p style={{ marginTop: '16px', color: '#00FFCA' }}>
              <strong>DezAI</strong> - Professional Audio Analysis for Music Producers
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;