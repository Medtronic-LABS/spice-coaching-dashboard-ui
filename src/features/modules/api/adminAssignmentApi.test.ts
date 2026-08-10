import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAssignmentUsersMutationBody } from './adminAssignmentApi';

const mockBaseQuerySpy = vi.fn();

vi.mock('@/store/apis/mockBaseQuery', () => ({
  mockBaseQuery: (...args: unknown[]) => mockBaseQuerySpy(...args),
}));

async function createAssignmentStore() {
  const { baseApi } = await import('@/store/apis/base');
  const { adminAssignmentApi } = await import('./adminAssignmentApi');
  return {
    adminAssignmentApi,
    store: configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    }),
  };
}

describe('buildAssignmentUsersMutationBody', () => {
  it('includes expand_po_assignees only when provided', () => {
    expect(
      buildAssignmentUsersMutationBody({
        user_ids: [1],
        upazilas: ['Hatibandha'],
      }),
    ).toEqual({
      user_ids: [1],
      upazilas: ['Hatibandha'],
    });

    expect(
      buildAssignmentUsersMutationBody({
        user_ids: [1],
        expand_po_assignees: true,
      }),
    ).toEqual({
      user_ids: [1],
      upazilas: undefined,
      expand_po_assignees: true,
    });

    expect(
      buildAssignmentUsersMutationBody({
        user_ids: [1],
        expand_po_assignees: false,
      }),
    ).toEqual({
      user_ids: [1],
      upazilas: undefined,
      expand_po_assignees: false,
    });
  });
});

describe('adminAssignmentApi assignment requests', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('sends expand_po_assignees on replace module assigned users', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: { added_count: 1, removed_count: 0, assignment_ids: ['a1'] },
    });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.replaceModuleAssignedUsers.initiate({
          moduleId: 'mod-1',
          user_ids: [20],
          expand_po_assignees: true,
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/assignments/mod-1/users');
    expect(request.method).toBe('PUT');
    expect(request.body).toEqual({
      user_ids: [20],
      upazilas: undefined,
      expand_po_assignees: true,
    });
  });

  it('omits expand_po_assignees when not provided on replace', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: { added_count: 0, removed_count: 0, assignment_ids: [] },
    });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.replaceModuleAssignedUsers.initiate({
          moduleId: 'mod-2',
          user_ids: [21],
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.body).toEqual({
      user_ids: [21],
      upazilas: undefined,
    });
    expect(request.body).not.toHaveProperty('expand_po_assignees');
  });

  it('sends q on hierarchy users page requests when provided', async () => {
    mockBaseQuerySpy
      .mockResolvedValueOnce({
        data: {
          districts: [{ id: 10, name: 'Lalmonirhat' }],
          total: 1,
          total_pages: 1,
          limit: 200,
          offset: 0,
        },
      })
      .mockResolvedValueOnce({
        data: {
          users: [],
          total: 0,
          total_pages: 0,
          limit: 200,
          offset: 0,
        },
      });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.fetchHierarchyUsersPage.initiate({
          limit: 200,
          offset: 0,
          role: 'PO',
          q: '  salam  ',
        }),
      )
      .unwrap();

    const usersRequest = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(usersRequest.url).toBe('/admin/hierarchy/users');
    expect(usersRequest.params).toMatchObject({
      limit: 200,
      offset: 0,
      role: 'PO',
      q: 'salam',
    });
  });

  it('omits q on hierarchy users page when blank', async () => {
    mockBaseQuerySpy
      .mockResolvedValueOnce({
        data: {
          districts: [{ id: 10, name: 'Lalmonirhat' }],
          total: 1,
          total_pages: 1,
          limit: 200,
          offset: 0,
        },
      })
      .mockResolvedValueOnce({
        data: {
          users: [],
          total: 0,
          total_pages: 0,
          limit: 200,
          offset: 0,
        },
      });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.fetchHierarchyUsersPage.initiate({
          limit: 200,
          offset: 0,
          q: '   ',
        }),
      )
      .unwrap();

    const usersRequest = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(usersRequest.params).not.toHaveProperty('q');
  });

  it('sends q on districts page requests when provided', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        districts: [{ id: 10, name: 'Lalmonirhat' }],
        total: 1,
        total_pages: 1,
        limit: 200,
        offset: 0,
      },
    });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.fetchAdminDistrictsPage.initiate({
          limit: 200,
          offset: 0,
          q: '  lal  ',
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/districts');
    expect(request.params).toEqual({
      limit: 200,
      offset: 0,
      q: 'lal',
    });
  });

  it('sends q and district_id on upazilas page requests when provided', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        upazilas: [{ id: 1, name: 'Hatibandha', district_id: 10 }],
        total: 1,
        total_pages: 1,
        limit: 200,
        offset: 0,
      },
    });
    const { adminAssignmentApi, store } = await createAssignmentStore();

    await store
      .dispatch(
        adminAssignmentApi.endpoints.fetchAdminUpazilasPage.initiate({
          limit: 200,
          offset: 0,
          districtId: 10,
          q: 'hati',
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/admin/upazilas');
    expect(request.params).toEqual({
      limit: 200,
      offset: 0,
      district_id: 10,
      q: 'hati',
    });
  });
});
