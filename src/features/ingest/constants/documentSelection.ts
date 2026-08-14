import type { SourceDocumentSourceType } from '@/features/modules/api/adminSourceDocumentsApi';

/** Max documents that can be included in one ingestion run (matches prior upload cap). */
export const MAX_DOCUMENT_SELECTION = 10;

export const DOCUMENT_SELECTION_PAGE_SIZE = 5;

export const DOCUMENT_SELECTION_PAGE_SIZE_OPTIONS = [
  5, 10, 15, 25, 50,
] as const;

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
