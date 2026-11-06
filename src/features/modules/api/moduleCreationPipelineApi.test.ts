import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import { fetchBaseQuerySpy } from '@/test-utils/installTestFetchMock';

const mockBaseQuerySpy = fetchBaseQuerySpy;

async function publishWith(payload: {
  moduleId: string;
  assign_to_all?: boolean;
}) {
  mockBaseQuerySpy.mockResolvedValue({ data: { id: payload.moduleId } });
  const { baseApi } = await import('@/store/apis/base');
  const { moduleCreationPipelineApi } =
    await import('./moduleCreationPipelineApi');
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  await store
    .dispatch(
      moduleCreationPipelineApi.endpoints.publishModule.initiate(payload),
    )
    .unwrap();

  return mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
}

describe('moduleCreationPipelineApi publishModule', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('sends assign_to_all in the publish body when provided', async () => {
    const request = await publishWith({
      moduleId: 'mod-1',
      assign_to_all: false,
    });

    expect(request.url).toBe('/admin/modules/mod-1/publish');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ assign_to_all: false });
  });

  it('sends no body when assign_to_all is omitted so the mode is unchanged', async () => {
    const request = await publishWith({ moduleId: 'mod-1' });

    expect(request.url).toBe('/admin/modules/mod-1/publish');
    expect(request.body).toBeUndefined();
  });
});
