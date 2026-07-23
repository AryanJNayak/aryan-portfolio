/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables used in the app.
 */
interface ImportMetaEnv {
  /** Base URL for the backend API (empty in dev to use the proxy). */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
