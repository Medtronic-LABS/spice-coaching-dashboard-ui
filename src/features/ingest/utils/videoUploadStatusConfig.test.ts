import { describe, expect, it } from 'vitest';
import {
  EMPTY_VIDEO_UPLOAD_FILTERS,
  hasActiveVideoUploadFilters,
  isVideoUploadDateRangeInvalid,
  normalizeVideoUploadFilters,
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

  it('reports active filters for status or uploaded date selections', () => {
    expect(hasActiveVideoUploadFilters(EMPTY_VIDEO_UPLOAD_FILTERS)).toBe(false);
    expect(
      hasActiveVideoUploadFilters({
        ...EMPTY_VIDEO_UPLOAD_FILTERS,
        statuses: ['ingesting'],
      }),
    ).toBe(true);
    expect(
      hasActiveVideoUploadFilters({
        ...EMPTY_VIDEO_UPLOAD_FILTERS,
        uploadedAtFrom: '2026-01-01',
      }),
    ).toBe(true);
    expect(
      hasActiveVideoUploadFilters({
        ...EMPTY_VIDEO_UPLOAD_FILTERS,
        districtId: '10',
      }),
    ).toBe(true);
  });

  it('flags invalid uploaded date ranges', () => {
    expect(isVideoUploadDateRangeInvalid(EMPTY_VIDEO_UPLOAD_FILTERS)).toBe(
      false,
    );
    expect(
      isVideoUploadDateRangeInvalid({
        ...EMPTY_VIDEO_UPLOAD_FILTERS,
        uploadedAtFrom: '2026-02-01',
        uploadedAtTo: '2026-01-01',
      }),
    ).toBe(true);
  });

  it('normalizes filter draft values before apply', () => {
    expect(
      normalizeVideoUploadFilters({
        ...EMPTY_VIDEO_UPLOAD_FILTERS,
        statuses: ['failed', 'bogus', 'failed'],
        uploadedAtFrom: ' 2026-01-01 ',
        uploadedAtTo: ' 2026-01-31 ',
        divisionId: ' 1 ',
        districtId: '10abc',
      }),
    ).toEqual({
      statuses: ['failed'],
      uploadedAtFrom: '2026-01-01',
      uploadedAtTo: '2026-01-31',
      divisionId: '1',
      districtId: '',
      upazilaId: '',
    });
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
