import type { SourceDocumentSourceType } from '@/features/modules/api/adminSourceDocumentsApi';
import { TABLE_PAGE_SIZE_OPTIONS } from '@/utils/tablePagination';

/** Max documents that can be included in one ingestion run (matches prior upload cap). */
export const MAX_DOCUMENT_SELECTION = 10;

export const DOCUMENT_SELECTION_PAGE_SIZE = 5;

export const DOCUMENT_SELECTION_PAGE_SIZE_OPTIONS = TABLE_PAGE_SIZE_OPTIONS;

export const DEFAULT_DOCUMENT_SELECTION_PAGE_SIZE =
  DOCUMENT_SELECTION_PAGE_SIZE;

export const DOCUMENT_SELECTION_SEARCH_DEBOUNCE_MS = 300;

/** Knowledge-visible document types that ingest already supports (exclude video). */
export const INGESTABLE_KNOWLEDGE_SOURCE_TYPES: SourceDocumentSourceType[] = [
  'pdf',
  'docx',
  'pptx',
  'audio',
];
