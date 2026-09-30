/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_API: string;
  readonly VITE_ADMIN_TOKEN: string;
  readonly VITE_SPOTIFY_PLAYLIST_URL?: string;
  readonly VITE_BURITACA_PAYMENT_URL?: string;
  readonly VITE_KATAMARAN_PAYMENT_URL?: string;
  readonly VITE_CINTO_PAYMENT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
