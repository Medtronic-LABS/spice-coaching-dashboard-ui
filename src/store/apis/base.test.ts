import { describe, expect, it } from 'vitest';
import { apiBaseUrl, baseApi } from '@/store/apis/base';

describe('baseApi', () => {
  it('configures a single RTK Query API slice', () => {
    expect(baseApi.reducerPath).toBe('baseApi');
    expect(baseApi.endpoints).toBeDefined();
  });

  it('exposes a normalized API origin for absolute URLs', () => {
    expect(apiBaseUrl.length).toBeGreaterThan(0);
    expect(apiBaseUrl.endsWith('/')).toBe(false);
  });
});
