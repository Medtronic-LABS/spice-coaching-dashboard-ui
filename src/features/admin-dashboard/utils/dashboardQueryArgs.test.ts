import { describe, expect, it } from 'vitest';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import {
  PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
  buildDashboardGeoParams,
  buildDocumentUsageDateGeoArgs,
  buildModuleDemandSummaryQueryArgs,
  buildPublishedModuleCompletionsQueryArgs,
  buildTeamActivityQueryArgs,
  buildTeamMemberQuestionsQueryArgs,
} from '@/features/admin-dashboard/utils/dashboardQueryArgs';

function geography(
  ids: Partial<DashboardGeographyFilters>,
): DashboardGeographyFilters {
  return { ...EMPTY_DASHBOARD_GEOGRAPHY, ...ids };
}

describe('dashboardQueryArgs', () => {
  it('uses one fetch limit so KPI and training modules share cache', () => {
    expect(PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT).toBe(50);
  });

  it('omits blank geography params', () => {
    expect(
      buildDashboardGeoParams(
        geography({
          divisionId: '1',
          districtId: '',
          upazilaId: '   ',
        }),
      ),
    ).toEqual({ division_id: 1 });
  });

  it('builds team activity args with geography filters', () => {
    expect(
      buildTeamActivityQueryArgs(
        '2026-01-01',
        '2026-01-31',
        geography({
          divisionId: '1',
          districtId: '10',
          upazilaId: '100',
        }),
        {
          limit: 100,
          offset: 0,
          depth: 1,
        },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      division_id: 1,
      district_id: 10,
      upazila_id: 100,
      limit: 100,
      offset: 0,
      depth: 1,
    });
  });

  it('builds published module completion args with geography filters', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs(
        '2026-01-01',
        '2026-01-31',
        geography({
          districtId: '10',
        }),
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
      district_id: 10,
    });
  });

  it('includes module_id and sort extras for published module completions', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs(
        '2026-01-01',
        '2026-01-31',
        EMPTY_DASHBOARD_GEOGRAPHY,
        {
          limit: 20,
          offset: 40,
          module_id: ['mod-a', 'mod-b'],
          sort_by: 'published_at',
          sort_dir: 'asc',
        },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 20,
      offset: 40,
      module_id: ['mod-a', 'mod-b'],
      sort_by: 'published_at',
      sort_dir: 'asc',
    });
  });

  it('omits empty module_id from published module completion args', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs(
        '2026-01-01',
        '2026-01-31',
        EMPTY_DASHBOARD_GEOGRAPHY,
        { module_id: [] },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
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

  it('includes team activity search and sort extras', () => {
    expect(
      buildTeamActivityQueryArgs(
        '2026-01-01',
        '2026-01-31',
        EMPTY_DASHBOARD_GEOGRAPHY,
        {
          limit: 20,
          offset: 0,
          q: 'rina',
          sort_by: 'module_completion',
          sort_dir: 'asc',
        },
      ),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 20,
      offset: 0,
      q: 'rina',
      sort_by: 'module_completion',
      sort_dir: 'asc',
    });
  });

  it('builds team member questions args with geography filters', () => {
    expect(
      buildTeamMemberQuestionsQueryArgs(
        '2026-01-01',
        '2026-01-31',
        geography({
          divisionId: '1',
          districtId: '10',
          upazilaId: '100',
        }),
        42,
      ),
    ).toEqual({
      userId: 42,
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 20,
      offset: 0,
      division_id: 1,
      district_id: 10,
      upazila_id: 100,
    });
  });

  it('builds document usage date and geography args', () => {
    expect(
      buildDocumentUsageDateGeoArgs(
        '2026-01-01',
        '2026-01-31',
        geography({
          divisionId: '1',
          districtId: '10',
        }),
      ),
    ).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
      division_id: 1,
      district_id: 10,
    });
  });

  it('builds module demand summary args with geography and top_limit', () => {
    expect(
      buildModuleDemandSummaryQueryArgs(
        '2026-07-01',
        '2026-07-31',
        geography({
          divisionId: '1',
          upazilaId: '100',
        }),
        { top_limit: 5 },
      ),
    ).toEqual({
      from_date: '2026-07-01',
      to_date: '2026-07-31',
      top_limit: 5,
      division_id: 1,
      upazila_id: 100,
    });
  });
});
