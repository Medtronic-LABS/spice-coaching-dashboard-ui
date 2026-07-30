import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
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

vi.mock(
  '@/features/modules/api/adminKnowledgeApi',
  async (importOriginal) => {
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
  },
);

vi.mock('@/features/modules/hooks/useKnowledgePdfDocument', () => ({
  useKnowledgePdfDocument: () => ({
    pdf: null,
    pageCount: 5,
    isLoading: false,
    error: null,
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
    ).toBeInTheDocument();
    expect(screen.queryByText(/page splits/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (_, node) => node?.textContent === 'This PDF has 5 pages.',
      ),
    ).toBeInTheDocument();
  });

  it('can clear the original PDF thumbnail to leave it blank for backend generation', async () => {
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

    expect(
      await screen.findByText(/thumbnail \(blank — backend will generate\)/i),
    ).toBeInTheDocument();
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

    expect(
      await screen.findByText('End page must be ≤ 5.'),
    ).toBeInTheDocument();
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
});
