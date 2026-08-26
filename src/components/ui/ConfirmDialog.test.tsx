import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title, description, cancel, and confirm actions', () => {
    render(
      <ConfirmDialog
        open
        title="Deactivate module?"
        description="This will hide the module from learners."
        confirmLabel="Deactivate"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Deactivate module?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This will hide the module from learners.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'ring-1',
    );
    expect(
      screen.getByRole('button', { name: 'Deactivate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onConfirm and onClose from the action buttons', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete badge?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks close and confirm while confirming', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Discard New Module?"
        description="Draft will be discarded."
        confirmLabel="Discard New"
        confirmingLabel="Discarding…"
        isConfirming
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('button', { name: 'Discarding…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discarding…' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
