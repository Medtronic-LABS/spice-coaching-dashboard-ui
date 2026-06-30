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

  it('does not post remotely while error reporting is disabled', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_ERROR_REPORTING_URL', 'https://errors.example.com/report');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    reportError({
      message: 'prod failure',
      source: 'error-boundary',
    });

    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
    fetchSpy.mockRestore();
  });
});
