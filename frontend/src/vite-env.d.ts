/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_SUPABASE_PROCESS_AUDIO_URL: string;
    // add more VITE_* env vars here
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};