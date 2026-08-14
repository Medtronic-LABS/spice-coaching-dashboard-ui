import { describe, expect, it } from 'vitest';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import {
  PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
  buildDashboardGeoParams,
  buildDocumentUsageDateGeoArgs,
  buildPublishedModuleCompletionsQueryArgs,
  buildTeamActivityQueryArgs,
} from '@/features/admin-dashboard/utils/dashboardQueryArgs';

describe('dashboardQueryArgs', () => {
  it('uses one fetch limit so KPI and training modules share cache', () => {
    expect(PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT).toBe(50);
  });

  it('trims and omits blank geography params', () => {
    expect(
      buildDashboardGeoParams({
        division: '  Dhaka  ',
        district: '',
        upazila: '   ',
      }),
    ).toEqual({ division: 'Dhaka' });
  });

  it('builds team activity args with geography filters', () => {
    expect(
      buildTeamActivityQueryArgs(
        '2026-01-01',
        '2026-01-31',
        {
          division: 'Dhaka',
          district: 'Gazipur',
          upazila: 'Kaliakoir',
        },
        {
          limit: 100,
          offset: 0,
          depth: 1,
        },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      division: 'Dhaka',
      district: 'Gazipur',
      upazila_id: 'Kaliakoir',
      limit: 100,
      offset: 0,
      depth: 1,
    });
  });

  it('builds published module completion args with geography filters', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs('2026-01-01', '2026-01-31', {
        division: '',
        district: 'Gazipur',
        upazila: '',
      }),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
      district: 'Gazipur',
    });
  });

  it('omits empty geography params', () => {
    expect(
      buildTeamActivityQueryArgs(
        '2026-01-01',
        '2026-01-31',
        EMPTY_DASHBOARD_GEOGRAPHY,
        { limit: 1, offset: 0 },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 1,
      offset: 0,
    });
  });

  it('omits undefined team activity extras', () => {
    expect(
      buildTeamActivityQueryArgs(
        '2026-01-01',
        '2026-01-31',
        EMPTY_DASHBOARD_GEOGRAPHY,
        {
          limit: 100,
          offset: 0,
          depth: undefined,
        },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 100,
      offset: 0,
    });
  });

  it('builds document usage date and geography args', () => {
    expect(
      buildDocumentUsageDateGeoArgs('2026-01-01', '2026-01-31', {
        division: 'Dhaka',
        district: 'Gazipur',
        upazila: '',
      }),
    ).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
      division: 'Dhaka',
      district: 'Gazipur',
    });
  });
});
