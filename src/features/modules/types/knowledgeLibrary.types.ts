/** Upload mode: full document vs page-range splits (mutually exclusive). */
export type KnowledgeUploadMode = 'original' | 'split';

export type KnowledgeAssetStatus =
  | 'processing'
  | 'ready'
  | 'failed'
  | 'deactivated';

/** Frontend view model for a knowledge library row. */
export interface KnowledgeAsset {
  id: string;
  title: string;
  fileType: 'pdf';
  startPage: number;
  endPage: number;
  /** Page count of the parent PDF when known. */
  pageCount?: number;
  thumbnailUrl: string | null;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt: string;
  assigned: boolean;
  /** Whether the source document has been ingested. */
  ingested: boolean;
  status: KnowledgeAssetStatus;
  parentUploadId: string;
}

export interface KnowledgeSplitDraft {
  title: string;
  startPage: number;
  endPage: number;
  /** Optional local file for custom thumbnail before upload. */
  thumbnailFile?: File | null;
}

/** Default list filters for the knowledge library table. */
export type KnowledgeYesNoFilter = 'all' | 'yes' | 'no';

export interface KnowledgeLibraryFilters {
  q: string;
  uploadedBy: string;
  assigned: KnowledgeYesNoFilter;
  ingested: KnowledgeYesNoFilter;
  status: 'active' | 'deactivated';
  uploadedAtFrom: string;
  uploadedAtTo: string;
  updatedAtFrom: string;
  updatedAtTo: string;
  sortBy: 'uploaded_at' | 'updated_at' | 'title' | 'uploaded_by';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export const KNOWLEDGE_LIBRARY_FILTER_DEFAULTS: KnowledgeLibraryFilters = {
  q: '',
  uploadedBy: '',
  assigned: 'all',
  ingested: 'all',
  status: 'active',
  uploadedAtFrom: '',
  uploadedAtTo: '',
  updatedAtFrom: '',
  updatedAtTo: '',
  sortBy: 'uploaded_at',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
};
