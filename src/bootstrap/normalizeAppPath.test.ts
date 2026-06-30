import { afterEach, describe, expect, it } from 'vitest';
import { normalizeAppPath } from './normalizeAppPath';

describe('normalizeAppPath', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('adds a trailing slash for the app root path', () => {
    window.history.replaceState(null, '', '/medtronics-ui?tenantId=2');
    normalizeAppPath();
    expect(window.location.pathname).toBe('/medtronics-ui/');
    expect(window.location.search).toBe('?tenantId=2');
  });

  it('leaves already-normalized paths unchanged', () => {
    window.history.replaceState(null, '', '/medtronics-ui/module-library');
    normalizeAppPath();
    expect(window.location.pathname).toBe('/medtronics-ui/module-library');
  });
});
