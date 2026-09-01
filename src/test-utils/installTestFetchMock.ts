import { vi } from 'vitest';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import { testFetchRouter } from '@/test-utils/testFetchRouter';

const { fetchBaseQuerySpy } = vi.hoisted(() => ({
  fetchBaseQuerySpy: vi.fn(),
}));

vi.mock('@reduxjs/toolkit/query/react', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@reduxjs/toolkit/query/react')>();
  return {
    ...actual,
    fetchBaseQuery: vi.fn(() => fetchBaseQuerySpy),
  };
});

fetchBaseQuerySpy.mockImplementation((args: string | FetchArgs) =>
  testFetchRouter(args),
);

export { fetchBaseQuerySpy };
