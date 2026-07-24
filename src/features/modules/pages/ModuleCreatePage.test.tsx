import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleCreatePage } from './ModuleCreatePage';

const sessionState = vi.hoisted(() => ({
  session: null as { source_document_id: string; title?: string } | null,
}));

vi.mock('@/features/ingest/utils/ingestSessionStorage', () => ({
  readActiveIngestSession: () => sessionState.session,
  writeActiveIngestSession: vi.fn(),
  clearActiveIngestSession: vi.fn(),
}));

vi.mock('@/features/ingest/api/adminIngestApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/ingest/api/adminIngestApi')
    >();
  return {
    ...actual,
    useGetIngestStatusByDocumentQuery: vi.fn(() => ({
      data: {
        run_id: 'run-1',
        source_document_id: 'doc-restored',
        status: 'running',
        started_at: '2026-05-18T00:00:00Z',
        completed_at: null,
        error: null,
        steps: [
          {
            stage: 'parse',
            status: 'running',
            started_at: '2026-05-18T00:00:00Z',
            completed_at: null,
            input_summary: null,
            output_summary: null,
            error: null,
          },
        ],
        candidates: [],
      },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    })),
  };
});

describe('ModuleCreatePage', () => {
  beforeEach(() => {
    sessionState.session = null;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores in-progress ingestion from session and shows status polling UI', () => {
    sessionState.session = {
      source_document_id: 'doc-restored',
      title: 'Restored module',
    };

    renderWithProviders(<ModuleCreatePage />);

    expect(screen.getByRole('status')).toHaveTextContent(
      /ingestion in progress/i,
    );
    expect(screen.getByRole('status')).toHaveTextContent('doc-restored');
    expect(
      screen.getByText(/status is polled from the server/i),
    ).toBeInTheDocument();
    expect(screen.getByText('parse')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ingestion in progress/i }),
    ).toBeDisabled();
  });
});
