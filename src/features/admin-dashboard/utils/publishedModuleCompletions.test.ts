import { describe, expect, it } from 'vitest';
import {
  PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
  buildPublishedModuleCompletionsQueryArgs,
} from '@/features/admin-dashboard/utils/publishedModuleCompletions';

describe('publishedModuleCompletions', () => {
  it('builds shared query args for dashboard widgets', () => {
    expect(
      buildPublishedModuleCompletionsQueryArgs('2026-01-01', '2026-01-31'),
    ).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
    });
  });

  it('uses one fetch limit so KPI and training modules share cache', () => {
    expect(PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT).toBe(50);
  });
});
