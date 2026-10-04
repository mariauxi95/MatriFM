/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SPOTIFY_PLAYLIST_URL?: string;
  readonly VITE_BURITACA_PAYMENT_URL?: string;
  readonly VITE_KATAMARAN_PAYMENT_URL?: string;
  readonly VITE_CINTO_PAYMENT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
