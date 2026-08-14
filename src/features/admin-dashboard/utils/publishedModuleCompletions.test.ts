import { describe, expect, it } from 'vitest';
import {
  MODULE_PERFORMANCE_DISPLAY_LIMIT,
  PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
  buildPublishedModuleCompletionsQueryArgs,
} from '@/features/admin-dashboard/utils/publishedModuleCompletions';

describe('publishedModuleCompletions', () => {
  it('builds shared query args for paired dashboard widgets', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs('2026-01-01', '2026-01-31'),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
    });
  });

  it('keeps the performance widget display cap below the shared fetch limit', () => {
    expect(MODULE_PERFORMANCE_DISPLAY_LIMIT).toBeLessThan(
      PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
    );
  });
});
