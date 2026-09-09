import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoadErrorPanel } from '@/components/common/PageLoadErrorPanel';
import { reportError } from '@/observability/reportError';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'page' | 'section';
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

const ErrorBoundaryFallback = ({
  message,
  variant,
}: {
  message: string | null;
  variant: 'page' | 'section';
}) => {
  const { t } = useTranslation();

  return (
    <PageLoadErrorPanel
      variant={variant}
      title={t('common.somethingWentWrong')}
      description={t('common.pageLoadErrorSupport')}
      devDetails={message}
      footerHelp={variant === 'page' ? t('errorBoundary.footerHelp') : null}
      onRetry={() => window.location.reload()}
    />
  );
};

/**
 * React error boundaries must be class components until React exposes a
 * first-class hook alternative. This file is the sole intentional exception
 * to the project's functional-components rule.
 */
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
    reportError({
      message: error instanceof Error ? error.message : 'Unhandled UI error',
      stack: error instanceof Error ? error.stack : undefined,
      source: 'error-boundary',
      context: {
        componentStack:
          typeof errorInfo === 'object' &&
          errorInfo !== null &&
          'componentStack' in errorInfo
            ? String(errorInfo.componentStack)
            : undefined,
      },
    });
  }

  private getErrorMessage(error: unknown): string | null {
    if (error instanceof Error) return error.message || 'Error';
    if (typeof error === 'string') return error;
    return null;
  }

  public render() {
    if (this.state.hasError) {
      const message = this.getErrorMessage(this.state.error);
      const variant = this.props.variant ?? 'page';
      return (
        this.props.fallback ?? (
          <ErrorBoundaryFallback message={message} variant={variant} />
        )
      );
    }

    return this.props.children;
  }
}
