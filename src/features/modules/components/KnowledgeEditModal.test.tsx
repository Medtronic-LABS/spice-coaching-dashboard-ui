import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeEditModal } from '@/features/modules/components/KnowledgeEditModal';
import type { KnowledgeLibraryItem } from '@/features/modules/types/knowledgeLibrary.types';

const usePresignedFileUrlMock = vi.fn();

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: (objectName: string | null | undefined) =>
    usePresignedFileUrlMock(objectName),
}));

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
  beforeEach(() => {
    usePresignedFileUrlMock.mockReset();
    usePresignedFileUrlMock.mockImplementation(
      (objectName: string | null | undefined) => ({
        url: objectName
          ? `https://cdn.example.test/${encodeURIComponent(objectName)}`
          : null,
        isLoading: false,
        isError: false,
        objectName: objectName ?? null,
        error: undefined,
      }),
    );
  });

  it('renders title and save label when open', () => {
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
      screen.getByRole('heading', { name: 'Edit Knowledge' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('shows the existing thumbnail when the asset has a storage path', () => {
    render(
      <KnowledgeEditModal
        open
        asset={{
          ...sampleAsset,
          thumbnailStoragePath: 'thumbnails/htn.png',
        }}
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

    expect(usePresignedFileUrlMock).toHaveBeenCalledWith('thumbnails/htn.png');
    const thumbnail = screen.getByAltText('Knowledge thumbnail');
    expect(thumbnail).toHaveAttribute(
      'src',
      'https://cdn.example.test/thumbnails%2Fhtn.png',
    );
    expect(thumbnail).toHaveAttribute('draggable', 'false');
    expect(
      screen.getByText('Change thumbnail', { selector: 'label' }),
    ).toBeInTheDocument();
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

  it('shows the thumbnail size hint', () => {
    render(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title={sampleAsset.title}
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
      screen.getByText('PNG, JPEG, or WebP · max 5 MB'),
    ).toBeInTheDocument();
  });

  it('rejects an AVIF thumbnail without calling onThumbnailChange', () => {
    const onThumbnailChange = vi.fn();
    render(
      <KnowledgeEditModal
        open
        asset={sampleAsset}
        title={sampleAsset.title}
        thumbnailFile={null}
        error=""
        disabled={false}
        isSaving={false}
        onTitleChange={vi.fn()}
        onThumbnailChange={onThumbnailChange}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(['x'], 'preview.avif', { type: 'image/avif' })],
      },
    });

    expect(onThumbnailChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Unsupported format. Use PNG, JPEG, or WebP.',
    );
    expect(
      screen.queryByText('PNG, JPEG, or WebP · max 5 MB'),
    ).not.toBeInTheDocument();
  });
});
