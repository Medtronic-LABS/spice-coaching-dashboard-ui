import { afterEach, describe, expect, it } from 'vitest';
import { ROUTE_PREFIX } from '@/constants/routes';
import { normalizeAppPath } from './normalizeAppPath';

describe('normalizeAppPath', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('adds a trailing slash for the app root path', () => {
    window.history.replaceState(null, '', `${ROUTE_PREFIX}?tenantId=2`);
    normalizeAppPath();
    expect(window.location.pathname).toBe(`${ROUTE_PREFIX}/`);
    expect(window.location.search).toBe('?tenantId=2');
  });

  it('leaves already-normalized paths unchanged', () => {
    window.history.replaceState(null, '', `${ROUTE_PREFIX}/module-library`);
    normalizeAppPath();
    expect(window.location.pathname).toBe(`${ROUTE_PREFIX}/module-library`);
  });
});
