/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_USE_MOCK_MODULE_PIPELINE?: string;
  readonly VITE_ERROR_REPORTING_URL?: string;
  readonly VITE_COACHING_SUITE_ACCESS?: string;
  readonly VITE_ROUTE_PREFIX?: string;
  readonly VITE_SPICE_WEB_LOGIN_URL?: string;
  readonly VITE_SPICE_ADMIN_API_URL?: string;
  readonly VITE_SPICE_USER_API_URL?: string;
  readonly VITE_SPICE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
