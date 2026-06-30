import { describe, expect, it, vi } from 'vitest';
import { reportError } from '@/observability/reportError';

describe('reportError', () => {
  it('logs in development without calling fetch', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    reportError({
      message: 'boom',
      source: 'window',
    });

    expect(consoleError).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    consoleError.mockRestore();
    fetchSpy.mockRestore();
  });

  it('posts to VITE_ERROR_REPORTING_URL in production mode', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_ERROR_REPORTING_URL', 'https://errors.example.com/report');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });

    reportError({
      message: 'prod failure',
      source: 'error-boundary',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://errors.example.com/report',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      }),
    );

    vi.unstubAllEnvs();
    fetchSpy.mockRestore();
  });

  it('uses sendBeacon when available', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ERROR_REPORTING_URL', 'https://errors.example.com/report');

    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    reportError({
      message: 'beacon failure',
      source: 'window',
    });

    expect(sendBeacon).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
    fetchSpy.mockRestore();
  });
});
