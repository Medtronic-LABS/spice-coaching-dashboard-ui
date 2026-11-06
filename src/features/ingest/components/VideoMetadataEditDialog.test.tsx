import type { FetchArgs } from '@reduxjs/toolkit/query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SourceDocumentSummary } from '@/features/modules/api/adminSourceDocumentsApi';
import { fetchBaseQuerySpy } from '@/test-utils/installTestFetchMock';
import { renderWithProviders } from '@/test-utils/render';
import { VideoMetadataEditDialog } from './VideoMetadataEditDialog';

function makeDocument(
  overrides: Partial<SourceDocumentSummary> = {},
): SourceDocumentSummary {
  return {
    id: 'video-1',
    title: 'Edema training',
    source_type: 'video',
    status: 'ingested',
    content_domain: 'clinical',
    authority_label: '',
    stored_path: 'medtronics-storage/ingest/edema.mp4',
    original_filename: 'edema.mp4',
    description: null,
    thumbnail_storage_path: null,
    uploaded_date: '2026-11-05T09:00:00Z',
    ingested_at: '2026-11-05T09:05:00Z',
    updated_at: '2026-11-05T09:05:00Z',
    uploaded_by: null,
    updated_by: null,
    ingested_by: null,
    assigned: false,
    assign_to_all: true,
    sync_published_visible: false,
    ...overrides,
  };
}

function requestsTo(urlPart: string): FetchArgs[] {
  return fetchBaseQuerySpy.mock.calls
    .map((call) => call[0] as FetchArgs)
    .filter((request) => String(request.url).includes(urlPart));
}

describe('VideoMetadataEditDialog assignment mode', () => {
  afterEach(() => {
    fetchBaseQuerySpy.mockReset();
  });

  it('starts from the saved mode of the video', () => {
    renderWithProviders(
      <VideoMetadataEditDialog
        open
        document={makeDocument({ assign_to_all: false })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /specific/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /all sks/i })).not.toBeChecked();
  });

  it('treats a video without assign_to_all as Specific', () => {
    renderWithProviders(
      <VideoMetadataEditDialog
        open
        document={makeDocument({ assign_to_all: undefined })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /specific/i })).toBeChecked();
  });

  it('saves a changed mode through PUT assign-to-all', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    fetchBaseQuerySpy.mockResolvedValue({
      data: { source_document_id: 'video-1', assign_to_all: false },
    });
    renderWithProviders(
      <VideoMetadataEditDialog
        open
        document={makeDocument({ assign_to_all: true })}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    await user.click(screen.getByRole('radio', { name: /specific/i }));
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const [modeRequest] = requestsTo('/assign-to-all');
    expect(modeRequest.url).toBe(
      '/admin/source-documents/video-1/assign-to-all',
    );
    expect(modeRequest.method).toBe('PUT');
    expect(modeRequest.body).toEqual({ assign_to_all: false });
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'video-1', assign_to_all: false }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call assign-to-all when the mode is unchanged', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    fetchBaseQuerySpy.mockResolvedValue({
      data: makeDocument({ title: 'Edema training v2' }),
    });
    renderWithProviders(
      <VideoMetadataEditDialog
        open
        document={makeDocument({ assign_to_all: true })}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    const title = screen.getByLabelText(/title/i);
    await user.clear(title);
    await user.type(title, 'Edema training v2');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(requestsTo('/assign-to-all')).toHaveLength(0);
    expect(requestsTo('/admin/source-documents/video-1')).toHaveLength(1);
  });
});
