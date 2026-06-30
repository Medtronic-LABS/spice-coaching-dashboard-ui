import '@testing-library/jest-dom/vitest';
import '@/i18n/i18n';
import { beforeEach } from 'vitest';

/** Default test role: supervisor dashboard flows. Override in tests when needed. */
beforeEach(() => {
  window.sessionStorage.setItem('appRole', 'supervisor');
});
