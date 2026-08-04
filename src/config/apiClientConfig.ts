function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function assertProductionConfig(): void {
  if (!import.meta.env.PROD) return;

  if (!readEnv('VITE_API_BASE_URL')) {
    throw new Error(
      'Production build is missing required env: VITE_API_BASE_URL',
    );
  }
}

function assertTestConfig(): void {
  if (import.meta.env.MODE !== 'test') return;

  if (!readEnv('VITE_API_BASE_URL')) {
    throw new Error(
      'Test run is missing required env: VITE_API_BASE_URL. Copy .env.example to .env or set variables in CI.',
    );
  }
}

assertProductionConfig();
assertTestConfig();

function resolveApiBaseUrl(): string {
  const fromEnv = readEnv('VITE_API_BASE_URL');
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  if (import.meta.env.DEV) {
    console.warn(
      '[apiClientConfig] VITE_API_BASE_URL is unset; copy .env.example to .env and configure API settings.',
    );
  }

  return '';
}

/** API origin (no trailing slash). Use for absolute URLs e.g. file downloads, `EventSource`. */
export const apiBaseUrl = resolveApiBaseUrl();

/** Mock API is opt-in via VITE_USE_MOCK_API=true (tests always use mocks). */
export const useMockApi =
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITE_USE_MOCK_API === 'true';
