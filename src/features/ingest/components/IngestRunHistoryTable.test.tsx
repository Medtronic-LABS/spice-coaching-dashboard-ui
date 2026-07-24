import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IngestRunHistoryTable } from '@/features/ingest/components/IngestRunHistoryTable';
import { renderWithProviders } from '@/test-utils/render';

const refetch = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/ingest/api/adminIngestionRunsApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/ingest/api/adminIngestionRunsApi')
      >();
    return {
      ...actual,
      useFetchIngestionRunsQuery: () => ({
        data: {
          runs: [
            {
              id: 'run-1',
              source_document_id: 'document-1',
              status: 'succeeded',
              started_at: '2026-07-21T09:00:00Z',
              completed_at: '2026-07-21T09:05:00Z',
              error: null,
              document_label:
                'A very long ingestion document filename that must remain available.pdf',
              generated_card_count: 8,
              generated_quiz_count: 3,
              generated_module_count: 2,
            },
            {
              id: 'run-2',
              source_document_id: 'document-2',
              status: 'succeeded',
              started_at: '2026-07-21T10:00:00Z',
              completed_at: '2026-07-21T10:05:00Z',
              error: null,
              document_label: 'Document without generated modules.pdf',
              generated_card_count: 0,
              generated_quiz_count: 0,
              generated_module_count: 0,
            },
          ],
          total_runs: 2,
          total_pages: 1,
          limit: 10,
          offset: 0,
          has_next_page: false,
        },
        isLoading: false,
        isFetching: false,
        error: undefined,
        refetch,
        fulfilledTimeStamp: Date.parse('2026-07-21T10:10:00Z'),
      }),
    };
  },
);

describe('IngestRunHistoryTable', () => {
  it('renders the complete filename in a focusable truncated-text trigger', () => {
    const fileName =
      'A very long ingestion document filename that must remain available.pdf';

    renderWithProviders(<IngestRunHistoryTable />);

    const content = screen.getByText(fileName);
    expect(content).toHaveClass('truncate');
    expect(content.parentElement).toHaveAttribute('tabindex', '0');
    expect(content.parentElement).toHaveAttribute('aria-label', fileName);
  });

  it('renders generated-content counts in separate aligned cells', () => {
    renderWithProviders(<IngestRunHistoryTable />);

    expect(
      screen.getByRole('columnheader', {
        name: 'Modules / cards / quizzes',
      }),
    ).toBeInTheDocument();
    const modulesCell = screen.getByText('2 modules').closest('td');
    expect(modulesCell).toHaveTextContent('2 modules');
    expect(modulesCell).toHaveTextContent('8 cards');
    expect(modulesCell).toHaveTextContent('3 quizzes');
  });

  it('labels timing columns as Duration and Uploaded Date', () => {
    renderWithProviders(<IngestRunHistoryTable />);

    expect(
      screen.getByRole('columnheader', { name: 'Duration' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded Date' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Completed' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Started' }),
    ).not.toBeInTheDocument();
  });

  it('shows title-case status and a refresh icon with last updated', () => {
    renderWithProviders(<IngestRunHistoryTable />);

    expect(screen.getAllByText('Succeeded').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it('labels the final column as Actions', () => {
    renderWithProviders(<IngestRunHistoryTable />);

    expect(
      screen.getByRole('columnheader', { name: 'Actions' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', {
        name: 'Open generated modules',
      }),
    ).not.toBeInTheDocument();
  });

  it('disables the module action when a run generated no modules', () => {
    renderWithProviders(<IngestRunHistoryTable />);

    expect(screen.getByRole('button', { name: 'Open modules' })).toBeEnabled();
    const noModulesButton = screen.getByRole('button', { name: 'No modules' });
    expect(noModulesButton).toBeDisabled();
    expect(noModulesButton.parentElement).toHaveAttribute(
      'title',
      'No modules were generated for this ingestion.',
    );
  });
});
