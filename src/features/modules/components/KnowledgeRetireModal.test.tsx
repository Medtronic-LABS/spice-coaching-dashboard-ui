import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeRetireModal } from '@/features/modules/components/KnowledgeRetireModal';
import type { KnowledgeLibraryItem } from '@/features/modules/types/knowledgeLibrary.types';

const sampleAsset: KnowledgeLibraryItem = {
  id: 'knowledge-asset-1',
  title: 'HTN Referral Guidelines',
  fileType: 'pdf',
  storedPath: 'knowledge/htn.pdf',
  originalFilename: 'htn.pdf',
  thumbnailStoragePath: null,
  uploadedAt: '2026-07-10T09:10:00Z',
  updatedAt: '2026-07-10T09:10:00Z',
  uploadedBy: 'alice',
  assigned: true,
  ingested: false,
  status: 'active',
  description: null,
};

describe('KnowledgeRetireModal', () => {
  it('renders document title and confirm label when open', () => {
    render(
      <KnowledgeRetireModal
        open
        asset={sampleAsset}
        error=""
        disabled={false}
        isRetiring={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Delete knowledge document' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();
    expect(screen.getByText(/HTN Referral Guidelines/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /This will retire the knowledge document and remove it from users’ access and active assignments/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-spice-semantic-error',
    );
  });

  it('shows Deleting… and blocks cancel while busy', () => {
    render(
      <KnowledgeRetireModal
        open
        asset={sampleAsset}
        error="Retire failed"
        disabled
        isRetiring
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Retire failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('calls onConfirm and onClose when enabled', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <KnowledgeRetireModal
        open
        asset={sampleAsset}
        error=""
        disabled={false}
        isRetiring={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
