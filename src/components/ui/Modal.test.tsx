import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders in a portal on document.body with scrollable mobile-friendly layout', () => {
    render(
      <Modal open labelledBy="test-modal-title" onClose={vi.fn()}>
        <div>
          <h2 id="test-modal-title">Test modal</h2>
          <p>Modal body</p>
        </div>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog).toHaveClass(
      'max-h-[min(90dvh,calc(100vh-1.5rem))]',
      'items-center',
    );
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('calls onClose for backdrop click and escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal open labelledBy="test-modal-title" onClose={onClose}>
        <div>
          <h2 id="test-modal-title">Closable modal</h2>
        </div>
      </Modal>,
    );

    const backdrop = document.body.querySelector('.bg-black\\/40');
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders a close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Modal open labelledBy="test-modal-title" onClose={onClose}>
        <div className="w-full max-w-md">
          <h2 id="test-modal-title">Closable modal</h2>
        </div>
      </Modal>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('centers constrained content and keeps close on the shell', () => {
    const onClose = vi.fn();
    render(
      <Modal
        open
        labelledBy="test-modal-title"
        onClose={onClose}
        contentClassName="max-w-4xl"
      >
        <div className="w-full" data-testid="modal-card">
          <h2 id="test-modal-title">Centered</h2>
        </div>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('items-center');
    const contentWrapper = dialog.firstElementChild;
    expect(contentWrapper).toHaveClass('relative', 'w-full', 'max-w-4xl');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal
        open
        labelledBy="test-modal-title"
        onClose={vi.fn()}
        showCloseButton={false}
      >
        <div>
          <h2 id="test-modal-title">No X</h2>
        </div>
      </Modal>,
    );

    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
  });

  it('locks body scroll while open', () => {
    const { unmount } = render(
      <Modal open labelledBy="test-modal-title">
        <div>
          <h2 id="test-modal-title">Scroll lock</h2>
        </div>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
