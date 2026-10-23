import { describe, expect, it } from 'vitest';
import {
  isDashboardDateRangeValid,
  resolveDashboardDateRange,
  seedCustomRangeFromPreset,
} from '@/features/admin-dashboard/utils/dateRange';

describe('resolveDashboardDateRange', () => {
  it('returns empty strings for an unseeded custom preset', () => {
    expect(
      resolveDashboardDateRange({
        durationPreset: 'custom',
        customFrom: '',
        customTo: '',
      }),
    ).toEqual({ fromDate: '', toDate: '' });
  });

  it('passes through trimmed custom dates', () => {
    expect(
      resolveDashboardDateRange({
        durationPreset: 'custom',
        customFrom: ' 2026-04-01 ',
        customTo: ' 2026-04-30 ',
      }),
    ).toEqual({ fromDate: '2026-04-01', toDate: '2026-04-30' });
  });
});

describe('isDashboardDateRangeValid', () => {
  it('rejects incomplete ranges', () => {
    expect(isDashboardDateRangeValid({ fromDate: '', toDate: '' })).toBe(false);
    expect(
      isDashboardDateRangeValid({ fromDate: '2026-04-01', toDate: '' }),
    ).toBe(false);
    expect(
      isDashboardDateRangeValid({ fromDate: '', toDate: '2026-04-30' }),
    ).toBe(false);
  });

  it('rejects inverted ranges', () => {
    expect(
      isDashboardDateRangeValid({
        fromDate: '2026-04-30',
        toDate: '2026-04-01',
      }),
    ).toBe(false);
  });

  it('accepts equal and ordered ranges', () => {
    expect(
      isDashboardDateRangeValid({
        fromDate: '2026-04-01',
        toDate: '2026-04-01',
      }),
    ).toBe(true);
    expect(
      isDashboardDateRangeValid({
        fromDate: '2026-04-01',
        toDate: '2026-04-30',
      }),
    ).toBe(true);
  });
});

describe('seedCustomRangeFromPreset', () => {
  it('copies the active preset range when switching into custom', () => {
    const seeded = seedCustomRangeFromPreset({
      durationPreset: 'this_month',
      customFrom: '',
      customTo: '',
    });

    expect(seeded.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(seeded.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(seeded.fromDate <= seeded.toDate).toBe(true);
    expect(
      resolveDashboardDateRange({
        durationPreset: 'this_month',
        customFrom: '',
        customTo: '',
      }),
    ).toEqual(seeded);
  });

  it('keeps a valid custom range when already on custom', () => {
    expect(
      seedCustomRangeFromPreset({
        durationPreset: 'custom',
        customFrom: '2026-01-10',
        customTo: '2026-01-20',
      }),
    ).toEqual({ fromDate: '2026-01-10', toDate: '2026-01-20' });
  });

  it('falls back to this month when custom is incomplete', () => {
    const seeded = seedCustomRangeFromPreset({
      durationPreset: 'custom',
      customFrom: '',
      customTo: '',
    });
    const thisMonth = resolveDashboardDateRange({
      durationPreset: 'this_month',
      customFrom: '',
      customTo: '',
    });

    expect(seeded).toEqual(thisMonth);
  });
});
