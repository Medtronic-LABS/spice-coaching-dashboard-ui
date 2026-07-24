import { describe, expect, it, vi } from 'vitest';

describe('apiClientConfig', () => {
  it('exposes a normalized API origin from VITE_API_BASE_URL', async () => {
    const { apiBaseUrl } = await import('@/config/apiClientConfig');
    expect(apiBaseUrl).toBe(
      String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, ''),
    );
    expect(apiBaseUrl.length).toBeGreaterThan(0);
  });

  it('normalizes a trailing slash on VITE_API_BASE_URL', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/medtronics-api/');

    const { apiBaseUrl } = await import('@/config/apiClientConfig');

    expect(apiBaseUrl).toBe('https://api.example.com/medtronics-api');

    vi.unstubAllEnvs();
  });

  it('warns when VITE_API_BASE_URL is unset in dev', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_API_BASE_URL', '');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { apiBaseUrl } = await import('@/config/apiClientConfig');

    expect(apiBaseUrl).toBe('');
    expect(warnSpy).toHaveBeenCalled();

    vi.unstubAllEnvs();
    warnSpy.mockRestore();
  });
});
