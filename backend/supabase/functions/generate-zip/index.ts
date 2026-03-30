import { serve } from 'std/server';

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = await req.json();
    const { fileKeys } = payload;
    if (!Array.isArray(fileKeys) || fileKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing fileKeys' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // TODO: récupérer les fichiers depuis Supabase Storage, zipper avec une lib adaptée et renvoyer URL.
    // Sous Supabase Edge, vous pourriez implémenter via un service externe Python ou un bucket temporaire.

    return new Response(JSON.stringify({ status: 'ok', message: 'ZIP generation stub', fileKeys }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-zip error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
