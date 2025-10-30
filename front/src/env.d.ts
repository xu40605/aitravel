/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XUNFEI_APP_ID: string
  readonly VITE_XUNFEI_API_KEY: string
  readonly VITE_XUNFEI_API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
