import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false, error: undefined };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, error: undefined };
  }

  public componentDidCatch(error: unknown, errorInfo: unknown) {
    this.setState({ error });
    // Keep logging lightweight; teams can wire this to a reporter later.

    console.error('Unhandled UI error', error, errorInfo);
  }

  private getErrorMessage(error: unknown): string | null {
    if (error instanceof Error) return error.message || 'Error';
    if (typeof error === 'string') return error;
    return null;
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign('/');
  };

  public render() {
    if (this.state.hasError) {
      const message = this.getErrorMessage(this.state.error);
      const showDetails = Boolean(import.meta.env?.DEV) && Boolean(message);

      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-50 text-red-700">
                    <span aria-hidden>!</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-slate-900">
                      Something went wrong
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      The dashboard hit an unexpected error. You can refresh the
                      page or go back to the home screen.
                    </p>
                    {showDetails ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <div className="font-medium text-slate-900">
                          Details (dev only)
                        </div>
                        <div className="mt-1 break-words">{message}</div>
                      </div>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={this.handleRefresh}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={this.handleGoHome}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      >
                        Go to home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-500">
                If this keeps happening, please share the steps to reproduce
                with the team.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
