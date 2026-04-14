import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Components that throw errors for testing
const ThrowError = ({ message }: { message?: string }) => {
  throw new Error(message || 'Test error');
};

const ThrowStringError = () => {
  throw 'String error';
};

const ThrowNullError = () => {
  throw null;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Suppress console.error in tests because ErrorBoundary is expected to log
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders default fallback UI when a standard Error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Custom error message" />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/The dashboard hit an unexpected error/i),
    ).toBeInTheDocument();

    // Check if dev details are shown (import.meta.env.DEV is typically true in test environments)
    expect(screen.getByText('Details (dev only)')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders default fallback UI for string errors', () => {
    render(
      <ErrorBoundary>
        <ThrowStringError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('String error')).toBeInTheDocument();
  });

  it('renders default fallback UI for null errors safely', () => {
    render(
      <ErrorBoundary>
        <ThrowNullError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom</div>}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('handles refresh button click', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('handles go to home button click', () => {
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: assignMock },
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(assignMock).toHaveBeenCalledWith('/');
  });
});
