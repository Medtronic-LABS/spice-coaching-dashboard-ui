import { describe, expect, it, vi } from 'vitest';

const reportErrorMock = vi.hoisted(() => vi.fn());

vi.mock('@/observability/reportError', () => ({
  reportError: reportErrorMock,
}));

import { initObservability } from '@/observability/initObservability';

describe('initObservability', () => {
  it('registers global error listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    initObservability();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
  });

  it('forwards window errors and rejections to reportError', () => {
    reportErrorMock.mockClear();
    const listeners = new Map<string, EventListener>();
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type, listener) => {
        if (typeof listener === 'function') {
          listeners.set(type, listener);
        }
      },
    );

    initObservability();

    listeners.get('error')?.(
      new ErrorEvent('error', {
        message: 'window blew up',
        error: new Error('window blew up'),
      }),
    );
    listeners.get('unhandledrejection')?.({
      reason: new Error('async blew up'),
    } as PromiseRejectionEvent);

    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'window blew up',
        source: 'window',
      }),
    );
    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'async blew up',
        source: 'unhandledrejection',
      }),
    );

    reportErrorMock.mockClear();
    listeners.get('error')?.(
      new ErrorEvent('error', {
        message: 'plain window error',
      }),
    );
    listeners.get('unhandledrejection')?.({
      reason: 'string rejection',
    } as PromiseRejectionEvent);

    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'plain window error',
        source: 'window',
      }),
    );
    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'string rejection',
        source: 'unhandledrejection',
      }),
    );
  });
});
