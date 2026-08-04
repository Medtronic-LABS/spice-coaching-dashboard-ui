export type ModuleStatus = 'published' | 'draft' | 'deactivated';

/** Shared list filters for module-library mock/API queries. */
export interface ModuleLibraryQueryParams {
  tenant_id: string;
  date_from: string;
  date_to: string;
  upazila_id?: string;
}

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
