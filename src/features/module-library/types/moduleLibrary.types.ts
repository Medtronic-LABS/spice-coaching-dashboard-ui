export type ModuleStatus = 'published' | 'draft';

export interface ModuleLibraryItem {
  id: string;
  title: string;
  category: string;
  lessons: number;
  questions: number;
  durationLabel: string;
  status: ModuleStatus;
  createdAt: string;
  draftProgress?: string;
}

export interface ModuleLibraryResponse {
  modules: ModuleLibraryItem[];
}
