import { reportError } from '@/observability/reportError';

export function initObservability(): void {
  window.addEventListener('error', (event) => {
    reportError({
      message: event.message || 'Unhandled error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: 'window',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'unhandledrejection',
    });
  });
}
