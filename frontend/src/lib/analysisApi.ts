import { supabase } from './supabaseClient';

export type AudioAnalysisResult = {
  bpm?: number;
  key?: string;
  duration?: number;
  energy?: number;
  genre?: string;
  style?: string;
  rhythm?: Record<string, any>;
  stems?: Record<string, string>;
  midi?: Record<string, string>;
};

export async function uploadAudioFile(file: File, userId: string) {
  const path = `audio/${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  return { path: data.path, url: supabase.storage.from('audio').getPublicUrl(data.path).data.publicUrl };
}

export async function requestAudioProcess(filePath: string) {
  const edgeUrl = import.meta.env.VITE_SUPABASE_PROCESS_AUDIO_URL || '/.netlify/functions/process-audio';

  const response = await fetch(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath }),
  });

  if (!response.ok) {
    throw new Error(`Échec process audio: ${response.status}`);
  }

  const result = await response.json();
  return result as AudioAnalysisResult;
}
