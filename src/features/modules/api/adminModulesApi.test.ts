import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockBaseQuerySpy = vi.fn();

vi.mock('@/store/apis/mockBaseQuery', () => ({
  mockBaseQuery: (...args: unknown[]) => mockBaseQuerySpy(...args),
}));

async function dispatchFetchModules(arg: {
  limit: number;
  offset: number;
  status?: string | null;
  sourceDocumentId?: string | null;
  q?: string | null;
}): Promise<FetchArgs> {
  mockBaseQuerySpy.mockResolvedValue({ data: [] });
  const { baseApi } = await import('@/store/apis/base');
  const { adminModulesApi } = await import('./adminModulesApi');
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  await store
    .dispatch(
      adminModulesApi.endpoints.fetchModules.initiate(
        arg as Parameters<
          typeof adminModulesApi.endpoints.fetchModules.initiate
        >[0],
      ),
    )
    .unwrap();

  return mockBaseQuerySpy.mock.calls[0]?.[0] as FetchArgs;
}

describe('adminModulesApi fetchModules request', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('sends source_document_id when a document filter is selected', async () => {
    const request = await dispatchFetchModules({
      limit: 20,
      offset: 0,
      status: 'draft',
      sourceDocumentId: 'doc-htn-protocol',
    });

    expect(request.url).toBe('/admin/modules');
    expect(request.params).toEqual({
      limit: 20,
      offset: 0,
      latest_version_only: true,
      status: 'draft',
      source_document_id: 'doc-htn-protocol',
    });
  });

  it('omits source_document_id and status when they are not provided', async () => {
    const request = await dispatchFetchModules({ limit: 20, offset: 40 });

    expect(request.params).toEqual({
      limit: 20,
      offset: 40,
      latest_version_only: true,
    });
    expect(request.params).not.toHaveProperty('source_document_id');
    expect(request.params).not.toHaveProperty('status');
  });

  it('sends q when a search query is provided', async () => {
    const request = await dispatchFetchModules({
      limit: 15,
      offset: 0,
      status: 'published',
      q: 'hyper',
    });

    expect(request.params).toEqual({
      limit: 15,
      offset: 0,
      latest_version_only: true,
      status: 'published',
      q: 'hyper',
    });
  });

  it('omits q when it is empty or null', async () => {
    const request = await dispatchFetchModules({
      limit: 15,
      offset: 0,
      q: '',
    });

    expect(request.params).not.toHaveProperty('q');
  });

  it('sends typed date range params when provided', async () => {
    const request = await dispatchFetchModules({
      limit: 20,
      offset: 0,
      status: 'published',
      created_from: '2026-01-01T00:00:00.000Z',
      created_to: '2026-01-31T23:59:59.999Z',
      published_from: '2026-02-01T00:00:00.000Z',
    });

    expect(request.params).toEqual({
      limit: 20,
      offset: 0,
      latest_version_only: true,
      status: 'published',
      created_from: '2026-01-01T00:00:00.000Z',
      created_to: '2026-01-31T23:59:59.999Z',
      published_from: '2026-02-01T00:00:00.000Z',
    });
    expect(request.params).not.toHaveProperty('date_from');
    expect(request.params).not.toHaveProperty('date_to');
  });
});

describe('adminModulesApi fetchModules response', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('normalizes paginated modules payload', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        modules: [
          {
            id: 'mod-1',
            module_family_id: 'fam-1',
            version: 1,
            title: { bn: 'Module one' },
            description: null,
            domain: 'clinical',
            module_type: 'refresher',
            lifecycle_status: 'draft',
            clinically_reviewed: false,
            has_visibility_window: false,
            card_count: 2,
            estimated_minutes: 10,
            published_at: null,
            created_at: '2026-01-01T00:00:00Z',
            quiz_count: 0,
          },
        ],
        total_modules: 5,
        total_pages: 3,
        limit: 2,
        offset: 0,
      },
    });

    const { baseApi } = await import('@/store/apis/base');
    const { adminModulesApi } = await import('./adminModulesApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    const result = await store
      .dispatch(
        adminModulesApi.endpoints.fetchModules.initiate({
          limit: 2,
          offset: 0,
        }),
      )
      .unwrap();

    expect(result).toEqual({
      modules: [
        expect.objectContaining({
          id: 'mod-1',
          domain: 'clinical',
          lifecycle_status: 'draft',
        }),
      ],
      total_modules: 5,
      total_pages: 3,
      limit: 2,
      offset: 0,
    });
  });
});
