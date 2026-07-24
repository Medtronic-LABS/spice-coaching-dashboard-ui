export type ModuleLibraryTab = 'all' | 'published' | 'drafts' | 'deactivated';

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
