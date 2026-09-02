import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import type { KnowledgeUploadPayload } from '@/features/modules/api/adminKnowledgeApi';
import { renderWithProviders } from '@/test-utils/render';
import { KnowledgeLibraryPage } from './KnowledgeLibraryPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  uploadKnowledgeDocumentTrigger: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/features/modules/api/adminKnowledgeApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminKnowledgeApi')
    >();

  return {
    ...actual,
    useUploadKnowledgeDocumentMutation: () => [
      mocks.uploadKnowledgeDocumentTrigger as (
        _payload: KnowledgeUploadPayload,
      ) => { unwrap: () => Promise<unknown> },
      {
        isLoading: false,
      },
    ],
  };
});

vi.mock('@/features/modules/api/adminFilesApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminFilesApi')
    >();
  return {
    ...actual,
    useUploadAdminFileMutation: () => [
      vi.fn(() => ({
        unwrap: () =>
          Promise.resolve({
            storage_path: 'microcoaching-uploads/media/mock-thumb.png',
            object_name: 'media/mock-thumb.png',
          }),
      })),
      { isLoading: false },
    ],
  };
});

vi.mock('@/features/modules/components/KnowledgeLibraryTable', () => ({
  KnowledgeLibraryTable: () => <div data-testid="knowledge-library-table" />,
}));

vi.mock('@/features/modules/hooks/useKnowledgePdfDocument', () => ({
  useKnowledgePdfDocument: () => ({
    pdf: null,
    pageCount: 5,
    isLoading: false,
    warning: null,
  }),
}));

vi.mock('@/features/modules/hooks/usePdfPageThumbnail', () => ({
  usePdfPageThumbnail: (_pdf: unknown, _page: unknown, enabled: boolean) => ({
    url: enabled ? 'blob:mock-original-thumb' : null,
    isRendering: false,
  }),
}));

function renderPage() {
  return renderWithProviders(<KnowledgeLibraryPage />);
}

function pdfInput() {
  const button = screen.getByRole('button', {
    name: /select pdf|replace pdf/i,
  });
  const input = button.parentElement?.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement | null;
  if (!input) {
    throw new Error('PDF file input not found next to Select PDF button');
  }
  return input;
}

describe('KnowledgeLibraryPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.uploadKnowledgeDocumentTrigger.mockReset();
  });

  it('does not show Original/Split tabs before a PDF is selected', async () => {
    renderPage();

    expect(
      screen.queryByRole('tab', { name: /upload original/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /split document/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/choose upload mode, pick one pdf/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/PDF file/)).toHaveTextContent('PDF file *');
  });

  it('rejects a non-PDF file', async () => {
    renderPage();

    const input = pdfInput() as HTMLInputElement;
    const file = new File(['x'], 'bad.txt', { type: 'text/plain' });

    // `userEvent.upload` may respect the `accept` attribute in jsdom, so
    // set `files` directly and dispatch change.
    Object.defineProperty(input, 'files', {
      value: [file],
    });
    fireEvent.change(input);

    expect(
      await screen.findByText(/unsupported file type: bad\.txt/i),
    ).toBeInTheDocument();

    // Should not transition into the upload-mode forms.
    expect(
      screen.queryByRole('tab', { name: /upload original/i }),
    ).not.toBeInTheDocument();
  });

  it('shows tabs and renders the Original form after selecting a PDF', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });

    await user.upload(input, pdf);

    const originalTab = await screen.findByRole('tab', {
      name: /upload original/i,
    });
    expect(originalTab).toHaveAttribute('aria-selected', 'true');

    expect(
      screen.getByPlaceholderText(/htn referral guidelines/i),
    ).toHaveAttribute('maxLength', String(FIELD_LIMITS.documentTitle));
    expect(screen.getByText(/^Title$/)).toHaveTextContent('Title *');
    expect(screen.queryByText(/page splits/i)).not.toBeInTheDocument();
    expect(screen.getByText(/This PDF has/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/pages?\./)).toBeInTheDocument();
  });

  it('can clear the original PDF thumbnail to leave it blank', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    expect(
      await screen.findByText(/thumbnail \(from pdf\)/i),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Knowledge thumbnail')).toHaveAttribute(
      'src',
      'blob:mock-original-thumb',
    );

    await user.click(
      screen.getByRole('button', { name: /remove selected image/i }),
    );

    expect(await screen.findByText(/thumbnail \(none\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /use pdf preview/i }),
    ).toBeInTheDocument();
  });

  it('in split mode, shows live warning when end page exceeds PDF page count', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    await user.click(screen.getByRole('tab', { name: /split document/i }));

    const end = screen.getByLabelText('Split 1 end page') as HTMLInputElement;
    await user.clear(end);
    await user.type(end, '9');

    expect(await screen.findByText(/End page must be ≤ 5/)).toBeInTheDocument();
    expect(mocks.uploadKnowledgeDocumentTrigger).not.toHaveBeenCalled();
  });

  it('in split mode, clicking Upload with invalid splits shows validation error (no API call)', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    await user.click(screen.getByRole('tab', { name: /split document/i }));
    expect(screen.getByText(/page splits/i)).toBeInTheDocument();
    expect(screen.getByText(/page splits/i)).not.toHaveTextContent('*');
    expect(screen.getByText(/^Title$/)).toHaveTextContent('Title *');
    expect(screen.getByText(/start page/i)).toHaveTextContent('Start page *');
    expect(screen.getByText(/end page/i)).toHaveTextContent('End page *');
    expect(
      screen.queryByText(/provide title and page range/i),
    ).not.toBeInTheDocument();

    const uploadButton = screen.getByRole('button', { name: /^upload$/i });
    expect(uploadButton).toBeEnabled();

    await user.click(uploadButton);

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(mocks.uploadKnowledgeDocumentTrigger).not.toHaveBeenCalled();
  });

  it('shows end-before-start validation inline (no API call)', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    await user.click(screen.getByRole('tab', { name: /split document/i }));

    const title = screen.getByLabelText('Split 1 title') as HTMLInputElement;
    await user.clear(title);
    await user.type(title, 'Split 1 title');

    const start = screen.getByLabelText(
      'Split 1 start page',
    ) as HTMLInputElement;
    await user.clear(start);
    await user.type(start, '2');

    const end = screen.getByLabelText('Split 1 end page') as HTMLInputElement;
    await user.clear(end);
    await user.type(end, '1');

    expect(
      await screen.findByText('End page must be >= start page.'),
    ).toBeInTheDocument();
    expect(mocks.uploadKnowledgeDocumentTrigger).not.toHaveBeenCalled();
  });

  it('shows validation for all invalid splits at once (no API call)', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = pdfInput();
    const pdf = new File(['%PDF-1.4'], 'knowledge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    await user.click(screen.getByRole('tab', { name: /split document/i }));

    await user.click(screen.getByRole('button', { name: /\+ Add Split/i }));

    // Split 1 stays invalid: missing title.
    const split2Title = screen.getByLabelText(
      'Split 2 title',
    ) as HTMLInputElement;
    await user.clear(split2Title);
    await user.type(split2Title, 'Split 2 title');

    const split2Start = screen.getByLabelText(
      'Split 2 start page',
    ) as HTMLInputElement;
    await user.clear(split2Start);
    await user.type(split2Start, '2');

    const split2End = screen.getByLabelText(
      'Split 2 end page',
    ) as HTMLInputElement;
    await user.clear(split2End);
    await user.type(split2End, '1');

    const uploadButton = screen.getByRole('button', { name: /^upload$/i });
    await user.click(uploadButton);

    expect(screen.getAllByText('Title is required.')).toHaveLength(1);
    expect(
      await screen.findByText('End page must be >= start page.'),
    ).toBeInTheDocument();
    expect(mocks.uploadKnowledgeDocumentTrigger).not.toHaveBeenCalled();
  });

  it('opens duplicate dialog on 409 and retries with override_duplicates', async () => {
    const user = userEvent.setup();
    const pdf = new File(['%PDF-1.4'], 'Health Testing 4 Topics.pdf', {
      type: 'application/pdf',
    });

    mocks.uploadKnowledgeDocumentTrigger
      .mockReturnValueOnce({
        unwrap: () =>
          Promise.reject({
            status: 409,
            data: {
              type: 'docs/error-codes.json#duplicate_content',
              title: 'Duplicate Content',
              status: 409,
              detail:
                'One or more files match already-uploaded or already-ingested content; set override to re-upload.',
              code: 'duplicate_content',
              conflicts: [
                {
                  filename: 'Health Testing 4 Topics.pdf',
                  title: 'Health Test doc',
                  content_sha256: 'abc123',
                  existing_source_documents: [
                    {
                      source_document_id:
                        '3f433af4-fcc0-4cda-acd6-d34db05e0191',
                      title: 'Health Test doc',
                      original_filename: 'Health Testing 4 Topics.pdf',
                      ingested_at: '2026-08-11T13:06:25.059379+00:00',
                      status: 'uploaded',
                    },
                  ],
                },
              ],
            },
          }),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve({ sources: [] }),
      });

    renderPage();
    await user.upload(pdfInput(), pdf);

    await user.click(
      screen.getByRole('button', { name: /remove selected image/i }),
    );
    await user.type(
      screen.getByPlaceholderText(/htn referral guidelines/i),
      'Health Test doc',
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    expect(
      await screen.findByRole('heading', { name: /duplicate file detected/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: /select health testing 4 topics\.pdf to upload as new source/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', {
        name: /select health testing 4 topics\.pdf to upload as new source/i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /upload as new source/i }),
    );

    await waitFor(() => {
      expect(mocks.uploadKnowledgeDocumentTrigger).toHaveBeenCalledTimes(2);
    });
    const secondPayload = mocks.uploadKnowledgeDocumentTrigger.mock
      .calls[1]?.[0] as KnowledgeUploadPayload;
    expect(secondPayload.overrideDuplicates).toBe(true);
    expect(secondPayload.title).toBe('Health Test doc');
  });

  it('skip upload on duplicate shows already-uploaded notice without override', async () => {
    const user = userEvent.setup();
    const pdf = new File(['%PDF-1.4'], 'Health Testing 4 Topics.pdf', {
      type: 'application/pdf',
    });

    mocks.uploadKnowledgeDocumentTrigger.mockReturnValueOnce({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            code: 'duplicate_content',
            title: 'Duplicate Content',
            detail: 'Duplicate content',
            conflicts: [
              {
                filename: 'Health Testing 4 Topics.pdf',
                title: 'Health Test doc',
                content_sha256: 'abc123',
                existing_source_documents: [
                  {
                    source_document_id: '3f433af4-fcc0-4cda-acd6-d34db05e0191',
                    title: 'Health Test doc',
                  },
                ],
              },
            ],
          },
        }),
    });

    renderPage();
    await user.upload(pdfInput(), pdf);
    await user.click(
      screen.getByRole('button', { name: /remove selected image/i }),
    );
    await user.type(
      screen.getByPlaceholderText(/htn referral guidelines/i),
      'Health Test doc',
    );
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    expect(
      await screen.findByRole('heading', { name: /duplicate file detected/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /skip upload/i }));

    expect(await screen.findByText(/already uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/health test doc/i)).toBeInTheDocument();
    expect(mocks.uploadKnowledgeDocumentTrigger).toHaveBeenCalledTimes(1);
  });
});
