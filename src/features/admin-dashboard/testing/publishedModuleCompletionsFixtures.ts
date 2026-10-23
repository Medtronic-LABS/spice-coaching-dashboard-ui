import type { PublishedModuleCompletionItem } from '@/features/admin-dashboard/types/dashboard.types';

export const LONG_MODULE_TITLE =
  'Safe motherhood counselling with a very long module title that should truncate in dashboard widgets';

export function buildPublishedModuleCompletionItem(
  index: number,
  overrides: Partial<PublishedModuleCompletionItem> = {},
): PublishedModuleCompletionItem {
  return {
    module_id: `module-${index}`,
    module_family_id: `family-${index}`,
    title: { bn: `${LONG_MODULE_TITLE} ${index}` },
    published_at: '2026-01-15T00:00:00Z',
    completed_sk_count: index + 1,
    assigned_sk_count: 10,
    total_descendant_sk_count: 10,
    ...overrides,
  };
}

export function buildPublishedModuleCompletionsResponse(moduleCount: number): {
  from_date: string;
  to_date: string;
  total_modules: number;
  total_descendant_sk_count: number;
  limit: number;
  offset: number;
  modules: PublishedModuleCompletionItem[];
} {
  return {
    from_date: '2026-01-01',
    to_date: '2026-01-31',
    total_modules: moduleCount,
    total_descendant_sk_count: moduleCount * 10,
    limit: 50,
    offset: 0,
    modules: Array.from({ length: moduleCount }, (_, index) =>
      buildPublishedModuleCompletionItem(index),
    ),
  };
}
