import { describe, expect, it } from 'vitest';
import { apiBaseUrl, apiCommonHeaders, baseApi } from '@/store/apis/base';

describe('baseApi', () => {
  it('configures a single RTK Query API slice', () => {
    expect(baseApi.reducerPath).toBe('baseApi');
    expect(baseApi.endpoints).toBeDefined();
  });

  it('exposes a normalized API origin for absolute URLs', () => {
    expect(apiBaseUrl.length).toBeGreaterThan(0);
    expect(apiBaseUrl.endsWith('/')).toBe(false);
  });

  it('defines shared reviewer headers for all requests', () => {
    expect(apiCommonHeaders['X-Reviewer-Id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(apiCommonHeaders['X-Reviewer-Token']).toBeTruthy();
  });
});
