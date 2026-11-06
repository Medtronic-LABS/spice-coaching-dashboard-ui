import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import { fetchBaseQuerySpy } from '@/test-utils/installTestFetchMock';

const mockBaseQuerySpy = fetchBaseQuerySpy;

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

describe('adminIngestApi upload assign_to_all', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  async function uploadWith(assignToAll?: boolean[]) {
    mockBaseQuerySpy.mockResolvedValue({
      data: { status: 'uploaded', sources: [] },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { adminIngestApi } = await import('./adminIngestApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });
    const files = [
      new File(['a'], 'a.mp4', { type: 'video/mp4' }),
      new File(['b'], 'b.mp4', { type: 'video/mp4' }),
    ];

    await store
      .dispatch(
        adminIngestApi.endpoints.uploadIngestFiles.initiate({
          files,
          ...(assignToAll ? { assign_to_all: assignToAll } : {}),
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    return request.body as FormData;
  }

  it('sends assign_to_all as a JSON array aligned to files', async () => {
    const form = await uploadWith([true, false]);

    expect(form.get('assign_to_all')).toBe('[true,false]');
  });

  it('omits assign_to_all so the backend default applies', async () => {
    const form = await uploadWith();

    expect(form.has('assign_to_all')).toBe(false);
  });
});
