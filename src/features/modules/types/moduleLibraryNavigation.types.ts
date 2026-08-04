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
};
