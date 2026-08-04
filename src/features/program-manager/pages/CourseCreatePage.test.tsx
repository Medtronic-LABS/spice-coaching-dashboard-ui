import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/render';
import { CourseCreatePage } from './CourseCreatePage';

const sessionState = vi.hoisted(() => ({
  session: null as {
    batch_id: string;
    source_document_id?: string;
    title?: string;
  } | null,
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
    useGetIngestBatchStatusQuery: vi.fn(() => ({
      data: {
        batch_id: 'batch-restored',
        status: 'running',
        created_at: '2026-05-18T00:00:00Z',
        sources: [
          {
            source_document_id: 'doc-restored',
            title: 'Restored module',
            status: 'running',
            nodes: [
              {
                key: 'parse',
                title: 'Parsing document',
                status: 'running',
                started_at: '2026-05-18T00:00:00Z',
                completed_at: null,
                error: null,
              },
            ],
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    })),
  };
});

describe('CourseCreatePage', () => {
  beforeEach(() => {
    sessionState.session = null;
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores in-progress ingestion from session and shows status polling UI', () => {
    sessionState.session = {
      batch_id: 'batch-restored',
      source_document_id: 'doc-restored',
      title: 'Restored module',
    };

    renderWithProviders(<CourseCreatePage />);

    expect(screen.getByRole('status')).toHaveTextContent(
      /ingestion in progress/i,
    );
    expect(screen.getByRole('status')).toHaveTextContent('batch-restored');
    expect(
      screen.getByText(/status is polled from the server/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Parsing document')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ingestion in progress/i }),
    ).toBeDisabled();
  });
});
