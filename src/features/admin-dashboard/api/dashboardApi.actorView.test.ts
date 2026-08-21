import type { FetchArgs } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockBaseQuerySpy = vi.fn();

vi.mock('@/store/apis/mockBaseQuery', () => ({
  mockBaseQuery: (...args: unknown[]) => mockBaseQuerySpy(...args),
}));

describe('dashboardApi actor view query param', () => {
  afterEach(() => {
    mockBaseQuerySpy.mockReset();
  });

  it('sends view on digital-help-modules when provided', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        modules: [],
        total_modules: 0,
        total_pages: 0,
        limit: 10,
        offset: 0,
      },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { dashboardApi } = await import('./dashboardApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    await store
      .dispatch(
        dashboardApi.endpoints.fetchDigitalHelpModules.initiate({
          from_date: '2026-01-01',
          to_date: '2026-01-31',
          limit: 10,
          offset: 0,
          geography: {
            divisionId: '',
            districtId: '',
            upazilaId: '',
          },
          view: 'po',
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/dashboard/digital-help-modules');
    expect(request.params).toMatchObject({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      view: 'po',
    });
  });

  it('sends view on module-creation-suggestions when provided', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        suggestions: [],
        total_suggestions: 0,
        total_pages: 0,
        limit: 10,
        offset: 0,
      },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { dashboardApi } = await import('./dashboardApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    await store
      .dispatch(
        dashboardApi.endpoints.fetchModuleCreationSuggestions.initiate({
          from_date: '2026-01-01',
          to_date: '2026-01-31',
          limit: 10,
          offset: 0,
          geography: {
            divisionId: '',
            districtId: '',
            upazilaId: '',
          },
          view: 'sk',
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/dashboard/module-creation-suggestions');
    expect(request.params).toMatchObject({
      view: 'sk',
    });
  });

  it('sends view on digital-help module questions and requests', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        questions: [],
        requests: [],
        total_questions: 0,
        total_requests: 0,
        limit: 50,
        offset: 0,
      },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { dashboardApi } = await import('./dashboardApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    const geography = {
      divisionId: '',
      districtId: '',
      upazilaId: '',
    };

    await store
      .dispatch(
        dashboardApi.endpoints.fetchDigitalHelpModuleQuestions.initiate({
          moduleId: 'mod-1',
          from_date: '2026-01-01',
          to_date: '2026-01-31',
          geography,
          view: 'po',
        }),
      )
      .unwrap();

    let request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/dashboard/digital-help-modules/mod-1/questions');
    expect(request.params).toMatchObject({ view: 'po' });

    await store
      .dispatch(
        dashboardApi.endpoints.fetchDigitalHelpModuleRequests.initiate({
          moduleId: 'mod-1',
          from_date: '2026-01-01',
          to_date: '2026-01-31',
          geography,
          view: 'sk',
        }),
      )
      .unwrap();

    request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/dashboard/digital-help-modules/mod-1/requests');
    expect(request.params).toMatchObject({ view: 'sk' });
  });

  it('sends view on module-creation-suggestion detail', async () => {
    mockBaseQuerySpy.mockResolvedValue({
      data: {
        suggestion: {
          id: 'sug-1',
          suggestion_date: '2026-01-01',
          suggestion_kind: 'proposed_topic',
          display_title: 'Topic',
          evidence_count: 0,
        },
        questions: [],
        requests: [],
      },
    });
    const { baseApi } = await import('@/store/apis/base');
    const { dashboardApi } = await import('./dashboardApi');
    const store = configureStore({
      reducer: { [baseApi.reducerPath]: baseApi.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    await store
      .dispatch(
        dashboardApi.endpoints.fetchModuleCreationSuggestionDetail.initiate({
          suggestionId: 'sug-1',
          geography: {
            divisionId: '',
            districtId: '',
            upazilaId: '',
          },
          view: 'po',
        }),
      )
      .unwrap();

    const request = mockBaseQuerySpy.mock.calls.at(-1)?.[0] as FetchArgs;
    expect(request.url).toBe('/dashboard/module-creation-suggestions/sug-1');
    expect(request.params).toMatchObject({ view: 'po' });
  });
});
