export type ErrorReportSource =
  | 'error-boundary'
  | 'window'
  | 'unhandledrejection';

export type ErrorReport = {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  source: ErrorReportSource;
};

/** Remote error reporting is disabled until VITE_ERROR_REPORTING_URL is re-enabled in CI. */
const REMOTE_ERROR_REPORTING_ENABLED = false;

export function reportError(report: ErrorReport): void {
  if (import.meta.env.DEV) {
    console.error('[observability]', report);
    return;
  }

  if (!REMOTE_ERROR_REPORTING_ENABLED) return;

  const endpoint = import.meta.env.VITE_ERROR_REPORTING_URL?.trim();
  if (!endpoint) return;

  const payload = JSON.stringify({
    ...report,
    ts: Date.now(),
    href: window.location.href,
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      endpoint,
      new Blob([payload], { type: 'application/json' }),
    );
    if (sent) return;
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Best-effort reporting; never throw from the reporter.
  });
}
