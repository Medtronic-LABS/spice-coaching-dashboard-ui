import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeEditModal } from '@/features/modules/components/KnowledgeEditModal';
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

describe('KnowledgeEditModal', () => {
  it('renders title, asset id, and save label when open', () => {
    render(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title="HTN Referral Guidelines"
        thumbnailFile={null}
        error=""
        disabled={false}
        isSaving={false}
        onTitleChange={vi.fn()}
        onThumbnailChange={vi.fn()}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Knowledge Asset' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ID: knowledge-asset-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('disables save when title is blank and shows Saving… while busy', () => {
    const { rerender } = render(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title="   "
        thumbnailFile={null}
        error=""
        disabled={false}
        isSaving={false}
        onTitleChange={vi.fn()}
        onThumbnailChange={vi.fn()}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    rerender(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title="Updated title"
        thumbnailFile={null}
        error=""
        disabled
        isSaving
        onTitleChange={vi.fn()}
        onThumbnailChange={vi.fn()}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('calls onSave and onClose when enabled', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const onTitleChange = vi.fn();

    render(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title="Updated title"
        thumbnailFile={null}
        error="Something went wrong"
        disabled={false}
        isSaving={false}
        onTitleChange={onTitleChange}
        onThumbnailChange={vi.fn()}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'x');
    expect(onTitleChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
