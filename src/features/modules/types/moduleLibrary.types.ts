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
  lastUpdatedAt?: string;
  publishedAt?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  generatedBy?: string | null;
  publishedBy?: string | null;
  activatedBy?: string | null;
  deactivatedBy?: string | null;
  draftProgress?: string;
  /** When true, module is Chatbot FAQ-only (not assignable to milestones). */
  chatbot_faqs_only?: boolean;
}

export interface ModuleLibraryResponse {
  modules: ModuleLibraryItem[];
}

export interface ModuleLibraryQueryParams {
  status?: ModuleStatus;
  category?: string;
  q?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
