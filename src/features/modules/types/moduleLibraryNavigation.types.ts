import type { ModuleLibraryTab } from '@/features/modules/utils/moduleListFilters';

export type { ModuleLibraryTab };

export type ModuleLibraryLocationState = {
  chwId?: string;
  tab?: ModuleLibraryTab;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  openAssignment?: {
    moduleId: string;
    moduleTitle: string;
  };
  openCreateModule?: {
    title_bn?: string;
    domain?: string;
  };
};

export function buildOpenCreateModuleNavigationState(
  topic: string,
): ModuleLibraryLocationState {
  const title_bn = topic.trim();
  return title_bn
    ? { openCreateModule: { title_bn } }
    : { openCreateModule: {} };
}
