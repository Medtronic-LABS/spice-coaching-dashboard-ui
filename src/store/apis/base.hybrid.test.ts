import { describe, expect, it, vi } from 'vitest';

const mockBaseQueryFn = vi.fn();
const realFetchQueryFn = vi.fn();

vi.mock('@/store/apis/mockBaseQuery', () => ({
  mockBaseQuery: (...args: unknown[]) => mockBaseQueryFn(...args),
}));

vi.mock('@reduxjs/toolkit/query/react', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@reduxjs/toolkit/query/react')>();
  return {
    ...actual,
    fetchBaseQuery: vi.fn(() => realFetchQueryFn),
  };
});

describe('apiRequestBaseQuery', () => {
  it('routes dashboard calls to mocks and admin calls to real fetch in hybrid mode', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_USE_MOCK_API', 'true');

    mockBaseQueryFn.mockResolvedValue({ data: 'mock-response' });
    realFetchQueryFn.mockResolvedValue({ data: 'real-response' });

    vi.doMock('@/config/apiClientConfig', () => ({
      apiBaseUrl: 'https://api.example.com',
      useMockApi: true,
    }));

    const { apiRequestBaseQuery } = await import('@/store/apis/base');
    const api = {} as Parameters<typeof apiRequestBaseQuery>[1];
    const extraOptions = {} as Parameters<typeof apiRequestBaseQuery>[2];

    await apiRequestBaseQuery('program-manager/overview', api, extraOptions);
    await apiRequestBaseQuery('/admin/modules', api, extraOptions);

    expect(mockBaseQueryFn).toHaveBeenCalledTimes(1);
    expect(realFetchQueryFn).toHaveBeenCalledTimes(1);

    vi.unstubAllEnvs();
    vi.doUnmock('@/config/apiClientConfig');
  });
});
