/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_API: string;
  readonly VITE_ADMIN_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
