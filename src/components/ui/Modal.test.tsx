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
