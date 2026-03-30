import { StemTrack } from './AudioPlayer';

type StemMixerProps = {
  stems: StemTrack[];
  onChange: (stems: StemTrack[]) => void;
};

export default function StemMixer({ stems, onChange }: StemMixerProps) {
  const isSolo = stems.some((s) => s.solo);

  const applyChange = (changed: StemTrack) => {
    onChange(stems.map((track) => (track.name === changed.name ? changed : track)));
  };

  return (
    <section className="card">
      <h2>Stem Mixer</h2>
      {stems.length === 0 ? (
        <p>Aucun stem disponible.</p>
      ) : (
        <div className="mixer-grid">
          {stems.map((stem) => {
            const effectiveMuted = stem.muted || (isSolo && !stem.solo);
            return (
              <div key={stem.name} className="mixer-row">
                <strong>{stem.name}</strong>
                <div className="mixer-controls">
                  <label>
                    Volume
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={stem.volume}
                      onChange={(e) => applyChange({ ...stem, volume: Number(e.target.value) })}
                    />
                  </label>
                  <button type="button" onClick={() => applyChange({ ...stem, muted: !stem.muted })} className={stem.muted ? 'active' : ''}>
                    {stem.muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button type="button" onClick={() => applyChange({ ...stem, solo: !stem.solo })} className={stem.solo ? 'active' : ''}>
                    {stem.solo ? 'Unsolo' : 'Solo'}
                  </button>
                </div>
                <p>{effectiveMuted ? 'Muté' : `Volume ${Math.round(stem.volume * 100)}%`}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
