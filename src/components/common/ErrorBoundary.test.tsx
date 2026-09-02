import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ message }: { message?: string }) => {
  throw new Error(message || 'Test error');
};

const ThrowStringError = () => {
  throw 'String error';
};

const ThrowNullError = () => {
  throw null;
};

function renderErrorBoundary(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    renderErrorBoundary(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders the page load error panel when a standard Error is thrown', () => {
    renderErrorBoundary(
      <ErrorBoundary>
        <ThrowError message="Custom error message" />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We couldn't retrieve the data. Please check your connection or try refreshing the page.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders default fallback UI for string errors', () => {
    renderErrorBoundary(
      <ErrorBoundary>
        <ThrowStringError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('String error')).toBeInTheDocument();
  });

  it('renders default fallback UI for null errors safely', () => {
    renderErrorBoundary(
      <ErrorBoundary>
        <ThrowNullError />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    renderErrorBoundary(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom</div>}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('handles retry button click', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    renderErrorBoundary(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('renders go to dashboard action', () => {
    renderErrorBoundary(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('button', { name: /go to dashboard/i }),
    ).toBeInTheDocument();
  });
});
