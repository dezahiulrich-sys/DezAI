import { serve } from 'std/server';

const DEMUCS_API_URL = Deno.env.get('DEMUCS_API_URL') || 'https://your-python-service.example.com/demucs';

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const { path } = await req.json();
    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing audio path' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Auth validation
    const bearer = req.headers.get('Authorization') || '';
    if (!bearer.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Récupérer le fichier dans Supabase Storage
    // (Place-holder, à remplacer par client Supabase JS/SDK côté Edge si nécessaire)

    // 2. Appeler service Python / Demucs pour stems + MIDI
    const demucsResponse = await fetch(DEMUCS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: `https://your-supabase-project-url.supabase.co/storage/v1/object/public/audio/${path}`,
        user_id: 'anonymous',
        filename: path.split('/').pop(),
        bpm: null
      }),
    });

    if (!demucsResponse.ok) {
      const text = await demucsResponse.text();
      return new Response(JSON.stringify({ error: 'Demucs request failed', details: text }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const demucsData = await demucsResponse.json();

    // 3. Enregistrer le résultat en DB (simplifié)
    // TODO: insérer dans table analyses via Supabase SQL

    return new Response(JSON.stringify({ status: 'ok', sourcePath: path, analysis: demucsData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('process-audio error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
