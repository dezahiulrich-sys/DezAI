import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [step, setStep] = useState<'splash' | 'app'>('splash');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState<boolean>(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
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
    setResults(null);
    
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
      setResults(result);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to simulation if API fails
      setTimeout(() => {
        const simulatedResult = {
          success: true,
          message: `File "${file.name}" processed with simulated results!`,
          analysis: {
            bpm: 128,
            key: 'C minor',
            duration: 120.0,
            energy: 0.78,
            genre: 'trap',
            style: 'boom bap',
            rhythm: { kick: 64, snare: 32, hihat: 128, shaker: 96 }
          },
          stems: {
            vocals: 'stems/vocals.wav',
            drums: 'stems/drums.wav',
            bass: 'stems/bass.wav',
            other: 'stems/other.wav',
            kick: 'stems/kick.wav',
            snare: 'stems/snare.wav',
            hihat: 'stems/hihat.wav',
            shaker: 'stems/shaker.wav'
          },
          midi: {
            melody: 'midi/melody.mid',
            bass: 'midi/bass.mid',
            chords: 'midi/chords.mid',
            drums: 'midi/drums.mid',
            kick: 'midi/kick.mid',
            snare: 'midi/snare.mid',
            hihat: 'midi/hihat.mid',
            shaker: 'midi/shaker.mid'
          }
        };
        setResults(simulatedResult);
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

  // Initialize Audio Context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      return () => {
        ctx.close();
      };
    }
  }, []);

  const playAudio = async (audioUrl: string, stemName: string) => {
    console.log('playAudio called:', stemName, 'audioUrl:', audioUrl);
    
    try {
      // If we're playing the original file (uploaded file)
      if (stemName === 'original' && selectedFile) {
        if (playingOriginal) {
          // Stop playing
          setPlayingOriginal(false);
          return;
        }
        
        // Create audio element for simple playback
        const audio = new Audio(URL.createObjectURL(selectedFile));
        audio.volume = 0.7;
        
        audio.onplay = () => {
          setPlayingOriginal(true);
          console.log('Started playing original file');
        };
        
        audio.onended = () => {
          setPlayingOriginal(false);
          console.log('Finished playing original file');
        };
        
        audio.onerror = (e) => {
          console.error('Error playing audio:', e);
          setPlayingOriginal(false);
          alert('Error playing audio file. Please try again.');
        };
        
        await audio.play();
        
      } else {
        // For stems, we need to fetch from the server
        if (playingAudio === stemName) {
          // Stop playing
          setPlayingAudio(null);
          return;
        }
        
        // Create a simple test tone for stems (since we don't have actual stem files yet)
        if (!audioContext) {
          console.error('AudioContext not initialized');
          alert('Audio context not initialized. Please refresh the page.');
          return;
        }
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Create oscillator for demo audio
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different stems
        let frequency = 440;
        let duration = 2000;
        
        switch(stemName) {
          case 'vocals': frequency = 523.25; duration = 1500; break;
          case 'drums': frequency = 392; duration = 1000; break;
          case 'bass': frequency = 261.63; duration = 2500; break;
          case 'kick': frequency = 65.41; duration = 800; break;
          case 'snare': frequency = 155.56; duration = 600; break;
          case 'hihat': frequency = 830.61; duration = 400; break;
          case 'shaker': frequency = 1046.50; duration = 300; break;
          case 'other': frequency = 329.63; duration = 1800; break;
          default: frequency = 440; duration = 2000;
        }
        
        oscillator.frequency.value = frequency;
        oscillator.type = stemName.includes('drums') || stemName === 'kick' || stemName === 'snare' ? 'square' : 'sine';
        gainNode.gain.value = 0.5;
        
        oscillator.start();
        
        // Stop after duration
        setTimeout(() => {
          oscillator.stop();
          setPlayingAudio(null);
        }, duration);
        
        setPlayingAudio(stemName);
        console.log(`Playing demo tone for ${stemName}: ${frequency}Hz`);
      }
      
    } catch (error) {
      console.error('Error playing audio:', error);
      alert(`Error playing audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test function for audio
  const testAudio = () => {
    console.log('Testing audio...');
    if (!audioContext) {
      alert('AudioContext not initialized');
      return;
    }
    
    // Create a simple test tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440; // A4
    oscillator.type = 'sine';
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    
    // Stop after 1 second
    setTimeout(() => {
      oscillator.stop();
      alert('Test audio played successfully! Check your speakers/headphones.');
    }, 1000);
  };

  return (
    <div className="container">
      {/* Aurora Borealis Background Effect */}
      <div className="aurora-borealis">
        <div className="aurora-layer aurora-layer-1" />
        <div className="aurora-layer aurora-layer-2" />
        <div className="aurora-layer aurora-layer-3" />
        <div className="aurora-streaks" />
        <div className="aurora-particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aurora-particle" />
          ))}
        </div>
      </div>

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
          {/* Header with Logo and Auth */}
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
              <div className="header-right">
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
                <motion.button
                  className="auth-toggle-button"
                  onClick={() => setShowAuth(!showAuth)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {user ? `👤 ${user.email?.split('@')[0]}` : '🔐 Sign In'}
                </motion.button>
              </div>
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
                style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 106, 0, 0.1)', borderRadius: '10px', border: '1px solid rgba(255, 106, 0, 0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ margin: 0, color: '#00FFCA', fontWeight: 'bold', fontSize: '16px' }}>
                      📁 {selectedFile.name}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Type: {selectedFile.type}
                    </p>
                  </div>
                  <button
                    style={{
                      background: playingOriginal ? 'rgba(255, 106, 0, 0.3)' : 'linear-gradient(135deg, #FF6A00, #FF8F12)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '120px',
                      justifyContent: 'center'
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche le déclenchement de l'upload
                      if (playingOriginal) {
                        setPlayingOriginal(false);
                      } else {
                        playAudio(URL.createObjectURL(selectedFile), 'original');
                      }
                    }}
                  >
                    {playingOriginal ? '⏸️ Stop' : '▶️ Play'}
                  </button>
                </div>
                
                {/* Audio Player Controls */}
                <div style={{ marginTop: '12px', background: 'rgba(20, 20, 30, 0.3)', padding: '12px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Progress</span>
                        <span style={{ color: '#00FFCA', fontSize: '12px' }}>0:00 / 2:30</span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '4px', 
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '0',
                          top: '0',
                          height: '100%',
                          width: playingOriginal ? '40%' : '0%',
                          background: 'linear-gradient(90deg, #FF6A00, #00FFCA)',
                          borderRadius: '2px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#00FFCA',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => alert('Rewind 10 seconds')}
                      >
                        ⏪
                      </button>
                      
                      <button
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#00FFCA',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => alert('Fast forward 10 seconds')}
                      >
                        ⏩
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', minWidth: '60px' }}>Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="80"
                      style={{ flex: 1, height: '6px', background: 'rgba(255, 106, 0, 0.3)', borderRadius: '3px' }}
                      onChange={(e) => alert(`Volume set to ${e.target.value}%`)}
                    />
                    <span style={{ color: '#00FFCA', fontSize: '12px', minWidth: '30px' }}>80%</span>
                  </div>
                </div>
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

          {/* Results Display */}
          {results && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginTop: '32px' }}
            >
              <div className="card">
                <h2>🎯 Analysis Results</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <div style={{ background: 'rgba(255, 106, 0, 0.1)', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#FF6A00' }}>BPM</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FFCA', margin: 0 }}>
                      {results.analysis?.bpm || 'N/A'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(0, 180, 153, 0.1)', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#00B499' }}>Key</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FFCA', margin: 0 }}>
                      {results.analysis?.key || 'N/A'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255, 140, 18, 0.1)', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#FF8F12' }}>Duration</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FFCA', margin: 0 }}>
                      {results.analysis?.duration ? `${results.analysis.duration}s` : 'N/A'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(0, 255, 202, 0.1)', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#00FFCA' }}>Energy</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00FFCA', margin: 0 }}>
                      {results.analysis?.energy ? `${(results.analysis.energy * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h3>🎵 Stem Separation & Audio Player</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {Object.entries(results.stems || {}).map(([stem, path]) => (
                      <div key={stem} style={{ 
                        background: 'rgba(20, 20, 30, 0.3)', 
                        padding: '16px', 
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 106, 0, 0.2)',
                        position: 'relative',
                        backdropFilter: 'blur(5px)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            background: 'linear-gradient(135deg, #FF6A00, #00FFCA)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {stem === 'vocals' ? '🎤' : 
                             stem === 'drums' ? '🥁' : 
                             stem === 'bass' ? '🎸' : 
                             stem === 'kick' ? '👢' :
                             stem === 'snare' ? '🥁' :
                             stem === 'hihat' ? '🔔' :
                             stem === 'shaker' ? '🎲' : '🎵'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'bold', color: '#00FFCA', fontSize: '16px' }}>
                              {stem.charAt(0).toUpperCase() + stem.slice(1)}
                            </span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                              {typeof path === 'string' ? path : 'Audio file'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Audio Player Controls */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            style={{
                              flex: 1,
                              background: playingAudio === stem ? 'rgba(255, 106, 0, 0.3)' : 'rgba(255, 106, 0, 0.1)',
                              border: '1px solid rgba(255, 106, 0, 0.5)',
                              color: playingAudio === stem ? '#FF6A00' : '#00FFCA',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                            onClick={() => {
                              if (playingAudio === stem) {
                                setPlayingAudio(null);
                              } else {
                                playAudio(`stems/${stem}.wav`, stem);
                              }
                            }}
                          >
                            {playingAudio === stem ? '⏸️ Stop' : '▶️ Play'}
                          </button>
                          
                          <button
                            style={{
                              background: 'rgba(0, 180, 153, 0.1)',
                              border: '1px solid rgba(0, 180, 153, 0.3)',
                              color: '#00FFCA',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                            onClick={() => alert(`Downloading ${stem}.wav...`)}
                          >
                            ⬇️
                          </button>
                        </div>
                        
                        {/* Volume Slider */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Volume:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              defaultValue="80"
                              style={{ flex: 1, height: '4px', background: 'rgba(255, 106, 0, 0.3)', borderRadius: '2px' }}
                              onChange={(e) => alert(`Volume set to ${e.target.value}% for ${stem}`)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h3>🎚️ Audio Mixer</h3>
                  <div style={{ 
                    background: 'rgba(20, 20, 30, 0.4)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 106, 0, 0.3)',
                    marginTop: '16px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                      {Object.entries(results.stems || {}).map(([stem, path]) => (
                        <div key={`mixer-${stem}`} style={{ textAlign: 'center' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '120px', 
                            background: 'linear-gradient(to top, rgba(255, 106, 0, 0.3), rgba(0, 180, 153, 0.3))',
                            borderRadius: '8px',
                            margin: '0 auto 12px auto',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              height: '80%',
                              background: 'linear-gradient(to top, #FF6A00, #00FFCA)',
                              borderRadius: '8px 8px 0 0'
                            }}></div>
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '0',
                              right: '0',
                              textAlign: 'center',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              80%
                            </div>
                          </div>
                          <div style={{ 
                            width: '60px', 
                            height: '4px', 
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '2px',
                            margin: '8px auto',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              width: '12px',
                              height: '16px',
                              background: '#00FFCA',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              left: '80%'
                            }}></div>
                          </div>
                          <span style={{ color: '#00FFCA', fontSize: '14px', fontWeight: 'bold' }}>
                            {stem.charAt(0).toUpperCase() + stem.slice(1)}
                          </span>
                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              style={{
                                background: playingAudio === stem ? 'rgba(255, 106, 0, 0.5)' : 'rgba(255, 106, 0, 0.2)',
                                border: 'none',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              onClick={() => {
                                if (playingAudio === stem) {
                                  setPlayingAudio(null);
                                } else {
                                  setPlayingAudio(stem);
                                }
                              }}
                            >
                              {playingAudio === stem ? '⏸️' : '▶️'}
                            </button>
                            <button
                              style={{
                                background: 'rgba(0, 180, 153, 0.2)',
                                border: 'none',
                                color: '#00FFCA',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              onClick={() => alert(`Solo ${stem}`)}
                            >
                              S
                            </button>
                            <button
                              style={{
                                background: 'rgba(255, 0, 0, 0.2)',
                                border: 'none',
                                color: '#FF6A00',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              onClick={() => alert(`Mute ${stem}`)}
                            >
                              M
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button
                        style={{
                          background: 'linear-gradient(135deg, #FF6A00, #FF8F12)',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                        onClick={() => {
                          setPlayingAudio(null);
                          alert('Playing all stems together...');
                        }}
                      >
                        ▶️ Play All
                      </button>
                      <button
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#00FFCA',
                          border: '1px solid rgba(0, 255, 202, 0.3)',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => alert('Exporting mixed audio...')}
                      >
                        💾 Export Mix
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h3>🎹 MIDI Files</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    {Object.entries(results.midi || {}).map(([instrument, path]) => (
                      <div key={instrument} style={{ 
                        background: 'rgba(0, 180, 153, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 180, 153, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            background: 'linear-gradient(135deg, #00B499, #00FFCA)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px'
                          }}>
                            🎵
                          </div>
                          <span style={{ fontWeight: 'bold', color: '#00FFCA' }}>
                            {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {typeof path === 'string' ? path : 'MIDI file'}
                        </p>
                        <button 
                          style={{
                            marginTop: '8px',
                            background: 'rgba(0, 180, 153, 0.2)',
                            border: '1px solid rgba(0, 180, 153, 0.5)',
                            color: '#00FFCA',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                          onClick={() => alert(`Download ${instrument}.mid`)}
                        >
                          Download MIDI
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255, 106, 0, 0.05)', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#FF6A00' }}>🎶 Additional Info</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Genre: </span>
                      <span style={{ color: '#00FFCA', fontWeight: 'bold' }}>{results.analysis?.genre || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Style: </span>
                      <span style={{ color: '#00FFCA', fontWeight: 'bold' }}>{results.analysis?.style || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status: </span>
                      <span style={{ color: '#00FFCA', fontWeight: 'bold' }}>{results.success ? '✅ Success' : '❌ Failed'}</span>
                    </div>
                  </div>
                  <p style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    {results.message || 'Processing completed successfully'}
                  </p>
                  
                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <button
                      style={{
                        background: 'linear-gradient(135deg, #FF6A00, #FF8F12)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                      onClick={() => {
                        // In a real app, this would download the stems
                        alert('Downloading all stems and MIDI files...');
                      }}
                    >
                      📥 Download All
                    </button>
                    <button
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#00FFCA',
                        border: '1px solid rgba(0, 255, 202, 0.3)',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                      onClick={() => {
                        setResults(null);
                        setSelectedFile(null);
                      }}
                    >
                      🔄 New Analysis
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Demo Content */}
          <div style={{ 
            marginTop: results ? '16px' : '32px', 
            padding: '24px', 
            background: 'rgba(20, 20, 30, 0.3)', 
            borderRadius: '12px',
            border: '1px solid rgba(255, 106, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ color: '#00FFCA', marginBottom: '16px' }}>🎵 Features</h2>
            <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> BPM Detection
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> Key/Tonalité Analysis
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> Stem Separation (Vocals, Drums, Bass, Other)
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> MIDI Generation for all instruments
              </li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> FL Studio Compatible MIDI Files
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF6A00' }}>✅</span> Groove Intelligence (Swing, Subdivisions)
              </li>
            </ul>
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '24px', 
            background: 'rgba(20, 20, 30, 0.3)', 
            borderRadius: '12px',
            border: '1px solid rgba(255, 106, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ color: '#00FFCA', marginBottom: '16px' }}>🚀 Quick Start</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px' }}>
              Upload an audio file to begin analysis. Supported formats: MP3, WAV, FLAC, AIFF, OGG.
            </p>
            
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 106, 0, 0.1)', borderRadius: '8px' }}>
              <h3 style={{ color: '#FF6A00', marginBottom: '12px' }}>🔊 Audio Test</h3>
              <p style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Test if audio playback is working on your system:
              </p>
              <button
                style={{
                  background: 'linear-gradient(135deg, #00FFCA, #00B499)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  width: '100%'
                }}
                onClick={testAudio}
              >
                🔊 Test Audio Playback
              </button>
              <p style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Click this button to test if Web Audio API is working. You should hear a 440Hz tone for 1 second.
              </p>
            </div>
            
            <p style={{ marginTop: '16px', color: '#00FFCA', fontWeight: 'bold' }}>
              <strong>DezAI</strong> - Professional Audio Analysis for Music Producers
            </p>
          </div>

          {/* Auth Modal */}
          <AnimatePresence>
            {showAuth && (
              <motion.div
                className="auth-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAuth(false)}
              >
                <motion.div
                  className="auth-modal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Auth onAuthChange={(user) => {
                    setUser(user);
                    if (user) setShowAuth(false);
                  }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}

export default App;