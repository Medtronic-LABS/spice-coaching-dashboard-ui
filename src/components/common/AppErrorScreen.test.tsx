import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorScreen } from '@/components/common/AppErrorScreen';
import { ApiErrorScreen } from '@/components/common/ApiErrorScreen';

describe('AppErrorScreen', () => {
  it('renders page-level actions', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <AppErrorScreen
        variant="page"
        title="Internal Error"
        description="Unexpected server failure."
        statusCode={500}
        errorCode="internal_error"
        onRefresh={onRefresh}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Internal Error' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP 500 · internal_error')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});

describe('ApiErrorScreen', () => {
  it('renders catalog-backed copy for known API errors', () => {
    render(
      <ApiErrorScreen
        error={{
          status: 403,
          data: { detail: { code: 'forbidden', message: 'Access denied.' } },
        }}
        onRetry={() => undefined}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Forbidden' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Access denied.')).toBeInTheDocument();
    expect(screen.getByText('HTTP 403 · forbidden')).toBeInTheDocument();
  });
});
