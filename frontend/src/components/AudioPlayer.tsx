import { useEffect, useMemo, useRef, useState } from 'react';

export type StemTrack = {
  name: string;
  url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
};

type AudioPlayerProps = {
  stems: StemTrack[];
  analysisTitle?: string;
};

export default function AudioPlayer({ stems, analysisTitle }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const timerRef = useRef<number | null>(null);

  const hasSources = stems.some((stem) => !!stem.url);

  const effectiveStems = useMemo<StemTrack[]>(() => {
    const hasSolo = stems.some((s) => s.solo);
    return stems.map((stem) => ({
      ...stem,
      muted: stem.muted || (hasSolo && !stem.solo),
    }));
  }, [stems]);

  useEffect(() => {
    // Prépare les elements audio
    effectiveStems.forEach((stem) => {
      if (!stem.url) return;
      let element = audioRefs.current[stem.name];
      if (!element) {
        element = new Audio(stem.url);
        element.crossOrigin = 'anonymous';
        audioRefs.current[stem.name] = element;
      }
      element.muted = stem.muted;
      element.volume = stem.volume;
      element.onloadedmetadata = () => {
        setDuration((prev) => Math.max(prev, element.duration || prev));
      };
      element.onended = () => {
        setPlaying(false);
        clearInterval(timerRef.current || undefined);
      };
    });

    return () => {
      Object.values(audioRefs.current).forEach((element) => {
        element.pause();
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [effectiveStems]);

  const syncAudio = async (action: 'play' | 'pause' | 'seek', targetTime?: number) => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (action === 'seek' && targetTime !== undefined) {
        audio.currentTime = targetTime;
      }
      if (action === 'play') {
        audio.play().catch(console.warn);
      } else if (action === 'pause') {
        audio.pause();
      }
    });
  };

  const handlePlayPause = () => {
    if (!hasSources) return;
    if (playing) {
      setPlaying(false);
      syncAudio('pause');
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setPlaying(true);
      syncAudio('play');
      timerRef.current = window.setInterval(() => {
        const times = Object.values(audioRefs.current).map((a) => a.currentTime);
        const maxTime = Math.max(...times, 0);
        setCurrentTime(maxTime);
        if (duration > 0) {
          setProgress((maxTime / duration) * 100);
        }
      }, 250);
    }
  };

  const handleSeek = (value: number) => {
    if (!hasSources || duration <= 0) return;
    syncAudio('seek', (value / 100) * duration);
    setCurrentTime((value / 100) * duration);
    setProgress(value);
  };

  return (
    <section className="card">
      <h2>Audio Player</h2>
      {!hasSources ? (
        <p>Aucun stem chargé pour lecture.</p>
      ) : (
        <>
          <p>
            {analysisTitle ? `${analysisTitle} · ` : ''}
            {playing ? 'En lecture' : 'En pause'} - {currentTime.toFixed(2)} / {duration.toFixed(2)}s
          </p>
          <div className="player-controls">
            <button type="button" onClick={handlePlayPause}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleSeek(Number(e.target.value))}
            />
          </div>
          <div className="track-list">
            {effectiveStems.map((stem) => (
              <div key={stem.name} className="track-item">
                <span>{stem.name}</span>
                <span>{stem.muted ? 'Muet' : `Vol ${(stem.volume * 100).toFixed(0)}%`}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
