import { useState } from 'react';
import { uploadAudioFile, requestAudioProcess, AudioAnalysisResult } from '../lib/analysisApi';
import { supabase } from '../lib/supabaseClient';

type AudioUploaderProps = {
  onResult: (result: AudioAnalysisResult) => void;
};

export default function AudioUploader({ onResult }: AudioUploaderProps) {
  const [status, setStatus] = useState('Prêt');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setStatus('Upload en cours...');

    const session = supabase.auth.getSession ? await supabase.auth.getSession() : null;
    const userId = session?.data?.session?.user?.id ?? 'anonymous';

    try {
      const { path } = await uploadAudioFile(file, userId);
      setStatus('Upload OK, traitement audio');

      const analysis = await requestAudioProcess(path);
      setStatus('Analyse terminée');

      onResult(analysis);
    } catch (error) {
      console.error(error);
      setStatus(`Erreur: ${(error as Error).message}`);
    }
  };

  return (
    <section className="card">
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p>{status}</p>
    </section>
  );
}
