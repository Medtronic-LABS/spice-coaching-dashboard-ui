import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SnackbarProvider,
  useSnackbar,
} from '@/components/ui/Snackbar/SnackbarProvider';

function SnackbarTrigger() {
  const snackbar = useSnackbar();
  return (
    <button type="button" onClick={() => snackbar.showSuccess('Saved changes')}>
      Notify
    </button>
  );
}

describe('SnackbarProvider', () => {
  it('shows a top snackbar and dismisses on close', async () => {
    const user = userEvent.setup();

    render(
      <SnackbarProvider>
        <SnackbarTrigger />
      </SnackbarProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved changes');

    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the default delay', () => {
    vi.useFakeTimers();

    render(
      <SnackbarProvider>
        <SnackbarTrigger />
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
