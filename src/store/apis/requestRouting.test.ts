import { describe, expect, it } from 'vitest';
import {
  getNormalizedRequestUrl,
  shouldUseRealFetchForRequest,
} from '@/store/apis/requestRouting';

describe('requestRouting', () => {
  it('normalizes leading slashes on request URLs', () => {
    expect(getNormalizedRequestUrl('/admin/modules')).toBe('admin/modules');
    expect(
      getNormalizedRequestUrl({ url: 'admin/ingest', method: 'POST' }),
    ).toBe('admin/ingest');
  });

  it('routes admin module and ingest endpoints to real fetch', () => {
    expect(shouldUseRealFetchForRequest('/admin/modules')).toBe(true);
    expect(
      shouldUseRealFetchForRequest({
        url: '/admin/ingest/by-document/doc-1',
        method: 'GET',
      }),
    ).toBe(true);
    expect(
      shouldUseRealFetchForRequest({
        url: '/admin/module-creation-pipeline',
        method: 'POST',
      }),
    ).toBe(true);
    expect(
      shouldUseRealFetchForRequest({
        url: '/admin/files',
        method: 'POST',
      }),
    ).toBe(true);
  });

  it('keeps non-admin module endpoints on mocks when hybrid mode is active', () => {
    expect(shouldUseRealFetchForRequest('module-library')).toBe(false);
    expect(shouldUseRealFetchForRequest('program-manager/courses/draft')).toBe(
      false,
    );
  });
});
