/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_ENABLE_PWA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
