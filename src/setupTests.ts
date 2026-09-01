import '@testing-library/jest-dom/vitest';
import '@/test-utils/installTestFetchMock';
import '@/i18n/i18n';
import { beforeEach, afterEach, vi } from 'vitest';
import { TEST_AUTH_USER } from '@/features/auth/constants/testAuthUser';
import { setAuthSession } from '@/features/auth/services/authSession';
import { fetchBaseQuerySpy } from '@/test-utils/installTestFetchMock';
import { testFetchRouter } from '@/test-utils/testFetchRouter';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/** Default test auth session for dashboard flows. */
beforeEach(() => {
  window.sessionStorage.clear();
  setAuthSession(TEST_AUTH_USER);
});

afterEach(() => {
  fetchBaseQuerySpy.mockImplementation((args) => testFetchRouter(args));
});
