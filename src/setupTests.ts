import '@testing-library/jest-dom/vitest';
import '@/i18n/i18n';
import { beforeEach, vi } from 'vitest';
import { DEFAULT_AUTH_USER } from '@/features/auth/constants/defaultAuthUser';
import { setAuthSession } from '@/features/auth/services/authSession';

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

/** Default test auth session and supervisor role for dashboard flows. */
beforeEach(() => {
  window.sessionStorage.clear();
  setAuthSession(DEFAULT_AUTH_USER);
});
