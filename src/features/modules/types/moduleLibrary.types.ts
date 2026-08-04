export type ModuleStatus =
  | 'published'
  | 'draft'
  | 'deactivated'
  | 'review_pending'
  | 'retired';

export interface ModuleLibraryItem {
  id: string;
  title: string;
  category: string;
  lessons: number;
  questions: number;
  durationLabel: string;
  status: ModuleStatus;
  createdAt: string;
  publishedAt?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  draftProgress?: string;
}

export interface ModuleLibraryResponse {
  modules: ModuleLibraryItem[];
}
