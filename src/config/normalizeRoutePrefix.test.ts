import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROUTE_PREFIX,
  normalizeRoutePrefix,
} from './normalizeRoutePrefix';

describe('normalizeRoutePrefix', () => {
  it('returns the default when unset or blank', () => {
    expect(normalizeRoutePrefix(undefined)).toBe(DEFAULT_ROUTE_PREFIX);
    expect(normalizeRoutePrefix('')).toBe(DEFAULT_ROUTE_PREFIX);
    expect(normalizeRoutePrefix('   ')).toBe(DEFAULT_ROUTE_PREFIX);
  });

  it('ensures a leading slash and strips trailing slashes', () => {
    expect(normalizeRoutePrefix('ai-coaching')).toBe('/ai-coaching');
    expect(normalizeRoutePrefix('/ai-coaching/')).toBe('/ai-coaching');
    expect(normalizeRoutePrefix('/medtronics-ui')).toBe('/medtronics-ui');
  });
});
