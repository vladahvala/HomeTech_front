/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' — працювати зі справжнім бекендом; будь-що інше — з моками */
  readonly VITE_USE_MOCKS?: string;
  /** Адреса API, за замовчуванням /api (Vite перенаправляє її на бекенд) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
