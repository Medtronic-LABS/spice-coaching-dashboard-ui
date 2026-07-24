import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const baseQuerySpy = vi.hoisted(() => vi.fn());

vi.mock('@reduxjs/toolkit/query/react', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@reduxjs/toolkit/query/react')>();
  return {
    ...actual,
    fetchBaseQuery: () => baseQuerySpy,
  };
});

async function dispatchFetchIngestionRuns(arg: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  baseQuerySpy.mockResolvedValue({
    data: {
      runs: [],
      total_runs: 0,
      total_pages: 0,
      limit: arg.limit ?? 50,
      offset: arg.offset ?? 0,
    },
  });
  const { baseApi } = await import('@/store/apis/base');
  const { adminIngestionRunsApi } = await import('./adminIngestionRunsApi');
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const result = await store.dispatch(
    adminIngestionRunsApi.endpoints.fetchIngestionRuns.initiate(arg),
  );
  return {
    request: baseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs,
    data: result.data,
  };
}

describe('adminIngestionRunsApi', () => {
  afterEach(() => {
    baseQuerySpy.mockReset();
  });

  it('requests paginated ingestion runs with limit and offset', async () => {
    const { request } = await dispatchFetchIngestionRuns({
      limit: 10,
      offset: 20,
    });
    expect(request.url).toBe('/admin/ingestion-runs');
    expect(request.method).toBe('GET');
    expect(request.params).toEqual({ limit: 10, offset: 20 });
  });

  it('includes optional status filter in the request', async () => {
    const { request } = await dispatchFetchIngestionRuns({
      status: 'failed',
      limit: 10,
      offset: 0,
    });
    expect(request.params).toEqual({
      limit: 10,
      offset: 0,
      status: 'failed',
    });
  });

  it('normalizes the paginated envelope with document_label and counts', async () => {
    baseQuerySpy.mockResolvedValueOnce({
      data: {
        runs: [
          {
            id: '7aba3ee1-68f7-4e7d-b5f0-d2085f1bba47',
            source_document_id: '588e2f63-2754-4490-9f83-c3df51c09818',
            status: 'succeeded',
            started_at: '2026-07-15T06:27:56.727824Z',
            completed_at: '2026-07-15T06:29:04.094506Z',
            error: {},
            document_label: 'TB Sceening.docx',
            generated_module_count: 1,
            generated_card_count: 4,
            generated_quiz_count: 4,
          },
        ],
        total_runs: 42,
        total_pages: 5,
        limit: 10,
        offset: 20,
      },
    });

    const { data } = await dispatchFetchIngestionRuns({
      limit: 10,
      offset: 20,
    });

    expect(data).toEqual({
      runs: [
        {
          id: '7aba3ee1-68f7-4e7d-b5f0-d2085f1bba47',
          source_document_id: '588e2f63-2754-4490-9f83-c3df51c09818',
          status: 'succeeded',
          started_at: '2026-07-15T06:27:56.727824Z',
          completed_at: '2026-07-15T06:29:04.094506Z',
          error: {},
          document_label: 'TB Sceening.docx',
          generated_module_count: 1,
          generated_card_count: 4,
          generated_quiz_count: 4,
        },
      ],
      total_runs: 42,
      total_pages: 5,
      limit: 10,
      offset: 20,
      has_next_page: true,
    });
  });

  it('defaults missing counts to 0 and trims document_label', async () => {
    baseQuerySpy.mockResolvedValueOnce({
      data: {
        runs: [
          {
            id: 'run-1',
            source_document_id: 'doc-1',
            status: 'running',
            started_at: '2026-07-15T06:27:56.727824Z',
            completed_at: null,
            error: null,
            document_label: '  protocol.pdf  ',
          },
        ],
        total_runs: 1,
        total_pages: 1,
        limit: 10,
        offset: 0,
      },
    });

    const { data } = await dispatchFetchIngestionRuns({ limit: 10, offset: 0 });

    expect(data?.runs[0]).toMatchObject({
      document_label: 'protocol.pdf',
      generated_module_count: 0,
      generated_card_count: 0,
      generated_quiz_count: 0,
      error: null,
    });
    expect(data?.has_next_page).toBe(false);
  });

  it('marks the last envelope page as having no next page', async () => {
    baseQuerySpy.mockResolvedValueOnce({
      data: {
        runs: [
          {
            id: 'run-last',
            source_document_id: 'doc-last',
            status: 'succeeded',
            started_at: '2026-07-14T11:00:00.000Z',
            completed_at: '2026-07-14T11:30:00.000Z',
            error: null,
            document_label: 'final.docx',
            generated_module_count: 1,
            generated_card_count: 2,
            generated_quiz_count: 2,
          },
        ],
        total_runs: 21,
        total_pages: 3,
        limit: 10,
        offset: 20,
      },
    });

    const { data } = await dispatchFetchIngestionRuns({
      limit: 10,
      offset: 20,
    });

    expect(data?.has_next_page).toBe(false);
    expect(data?.total_runs).toBe(21);
    expect(data?.total_pages).toBe(3);
  });
});
