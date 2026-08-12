import { describe, expect, it } from 'vitest';
import {
  filterAndRankSearchedModules,
  filterAndRankSuggestedModules,
} from '@/features/admin-dashboard/utils/moduleDemand';
import type { DigitalHelpModuleUsageItem } from '@/features/admin-dashboard/types/dashboard.types';

function module(
  id: string,
  digitalHelpCount: number,
  moduleRequestedCount: number,
): DigitalHelpModuleUsageItem {
  return {
    module_id: id,
    module_family_id: null,
    title: { en: id },
    digital_help_count: digitalHelpCount,
    module_requested_count: moduleRequestedCount,
  };
}

describe('moduleDemand ranking', () => {
  it('ranks searched modules by digital_help_count independently of requests', () => {
    const modules = [
      module('high-requests', 5, 100),
      module('high-searches', 80, 2),
      module('both', 40, 40),
      module('no-searches', 0, 50),
    ];

    expect(
      filterAndRankSearchedModules(modules).map((item) => item.module_id),
    ).toEqual(['high-searches', 'both', 'high-requests']);
  });

  it('ranks suggested modules by module_requested_count independently of searches', () => {
    const modules = [
      module('high-searches', 100, 3),
      module('high-requests', 4, 90),
      module('both', 40, 40),
      module('no-requests', 20, 0),
    ];

    expect(
      filterAndRankSuggestedModules(modules).map((item) => item.module_id),
    ).toEqual(['high-requests', 'both', 'high-searches']);
  });
});
