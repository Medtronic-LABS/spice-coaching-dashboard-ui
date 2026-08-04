import { describe, expect, it } from 'vitest';
import {
  EMPTY_VIDEO_UPLOAD_FILTERS,
  hasActiveVideoUploadFilters,
  normalizeVideoUploadStatuses,
  toggleVideoUploadStatus,
} from './videoUploadStatusConfig';

describe('videoUploadStatusConfig', () => {
  it('normalizes statuses by dropping unknowns and duplicates', () => {
    expect(
      normalizeVideoUploadStatuses([
        'ingested',
        'bogus',
        'failed',
        'ingested',
        'uploaded',
      ]),
    ).toEqual(['ingested', 'failed', 'uploaded']);
  });

  it('reports active filters only when statuses are selected', () => {
    expect(hasActiveVideoUploadFilters(EMPTY_VIDEO_UPLOAD_FILTERS)).toBe(false);
    expect(hasActiveVideoUploadFilters({ statuses: ['ingesting'] })).toBe(true);
  });

  it('toggles statuses on and off', () => {
    const withFailed = toggleVideoUploadStatus(
      EMPTY_VIDEO_UPLOAD_FILTERS,
      'failed',
    );
    expect(withFailed.statuses).toEqual(['failed']);

    const withoutFailed = toggleVideoUploadStatus(withFailed, 'failed');
    expect(withoutFailed.statuses).toEqual([]);
  });
});
