import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockBaseQuerySpy = vi.fn();

vi.mock('@/store/apis/mockBaseQuery', () => ({
  mockBaseQuery: (...args: unknown[]) => mockBaseQuerySpy(...args),
}));

describe('adminIngestApi retry ingest batch', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('POSTs /admin/ingest/batches/:batchId/retry with no body', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: { status: 'accepted' },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { adminIngestApi } = await import('./adminIngestApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    await store
      .dispatch(adminIngestApi.endpoints.retryIngestBatch.initiate('batch-1'))
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/ingest/batches/batch-1/retry');
    expect(request.method).toBe('POST');
    expect(request.body).toBeUndefined();
  });
});
