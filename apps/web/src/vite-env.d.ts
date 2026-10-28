/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_MCOM_CENTRAL_URL: string;
  readonly VITE_MCOM_CENTRAL_APP_URL: string;
  readonly VITE_MCOM_CLIENT_ID: string;
  readonly VITE_MCOM_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
