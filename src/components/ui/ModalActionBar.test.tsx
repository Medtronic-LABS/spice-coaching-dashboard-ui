import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalActionBar } from './ModalActionBar';

describe('ModalActionBar', () => {
  it('renders cancel and confirm with Assign-style secondary cancel', () => {
    render(
      <ModalActionBar
        confirmLabel="Assign"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toBeInTheDocument();
    expect(cancel).toHaveClass('ring-1');
    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
  });

  it('calls onCancel and onConfirm from the action buttons', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ModalActionBar
        confirmLabel="Save"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows confirming label and disables both actions while confirming', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ModalActionBar
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
        isConfirming
        destructive
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Deleting…' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveClass('bg-spice-semantic-error');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('hides cancel when showCancel is false', () => {
    render(
      <ModalActionBar
        confirmLabel="Continue"
        showCancel={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();
  });
});
