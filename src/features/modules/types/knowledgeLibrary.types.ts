/** Upload mode: full document vs page-range splits (mutually exclusive). */
export type KnowledgeUploadMode = 'original' | 'split';

export type KnowledgeLibraryStatusTab = 'active' | 'retired';

/** Frontend view model for a knowledge library row. */
export interface KnowledgeLibraryItem {
  id: string;
  title: string;
  fileType: 'pdf';
  storedPath: string;
  originalFilename: string | null;
  thumbnailStoragePath: string | null;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: string | null;
  assigned: boolean;
  ingested: boolean;
  status: string;
  description: string | null;
}

export interface KnowledgeSplitDraft {
  title: string;
  startPage: number;
  endPage: number;
  /** Optional local file for custom thumbnail before upload. */
  thumbnailFile?: File | null;
  /**
   * When true, hide the auto PDF preview so the slot stays blank.
   * No thumbnail is sent to the backend.
   */
  suppressAutoThumbnail?: boolean;
}

/** Default empty split row for Upload Knowledge split mode. */
export function createEmptyKnowledgeSplitDraft(): KnowledgeSplitDraft {
  return {
    title: '',
    startPage: 1,
    endPage: 1,
    thumbnailFile: null,
    suppressAutoThumbnail: false,
  };
}

export type KnowledgeYesNoFilter = '' | 'true' | 'false';

export interface KnowledgeLibraryFilters {
  q: string;
  status: KnowledgeLibraryStatusTab;
  uploadedAtFrom: string;
  uploadedAtTo: string;
  uploadedBy: string;
  assigned: KnowledgeYesNoFilter;
  ingested: KnowledgeYesNoFilter;
  sortBy: 'uploaded_date' | 'title';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export const KNOWLEDGE_LIBRARY_FILTER_DEFAULTS: KnowledgeLibraryFilters = {
  q: '',
  status: 'active',
  uploadedAtFrom: '',
  uploadedAtTo: '',
  uploadedBy: '',
  assigned: '',
  ingested: '',
  sortBy: 'uploaded_date',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
};
