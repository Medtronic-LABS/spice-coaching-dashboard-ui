import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import { fetchBaseQuerySpy } from '@/test-utils/installTestFetchMock';

const mockBaseQuerySpy = fetchBaseQuerySpy;

describe('adminDocumentAssignmentApi replace request', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('sends expand_po_assignees on replace document assigned users', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: { added_count: 1, removed_count: 0, assignment_ids: ['d1'] },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { adminDocumentAssignmentApi } =
      await import('./adminDocumentAssignmentApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    await store
      .dispatch(
        adminDocumentAssignmentApi.endpoints.replaceDocumentAssignedUsers.initiate(
          {
            sourceDocumentId: 'doc-1',
            user_ids: [20],
            expand_po_assignees: false,
          },
        ),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/document-assignments/doc-1/users');
    expect(request.method).toBe('PUT');
    expect(request.body).toEqual({
      user_ids: [20],
      expand_po_assignees: false,
    });
  });
});

describe('adminDocumentAssignmentApi set assign-to-all', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('PUTs /admin/source-documents/:id/assign-to-all with the mode', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: { source_document_id: 'doc-1', assign_to_all: true },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { adminDocumentAssignmentApi } =
      await import('./adminDocumentAssignmentApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    const result = await store
      .dispatch(
        adminDocumentAssignmentApi.endpoints.setSourceDocumentAssignToAll.initiate(
          { sourceDocumentId: 'doc-1', assign_to_all: true },
        ),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/source-documents/doc-1/assign-to-all');
    expect(request.method).toBe('PUT');
    expect(request.body).toEqual({ assign_to_all: true });
    expect(result).toEqual({
      source_document_id: 'doc-1',
      assign_to_all: true,
    });
  });
});
