/** Human-readable extensions shown in knowledge upload UI. */
export const KNOWLEDGE_ACCEPTED_FILE_TYPES_LABEL = 'PDF';

const KNOWLEDGE_ACCEPTED_EXTENSIONS = new Set(['pdf']);

const KNOWLEDGE_ACCEPTED_MIME_TYPES = new Set(['application/pdf']);

function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return '';
  return trimmed.slice(lastDot + 1);
}

/** Whether a picked file matches knowledge-supported extensions or MIME types. */
export function isKnowledgeAcceptedFile(file: File): boolean {
  const extension = fileExtension(file.name);
  if (extension && KNOWLEDGE_ACCEPTED_EXTENSIONS.has(extension)) return true;
  if (file.type && KNOWLEDGE_ACCEPTED_MIME_TYPES.has(file.type)) return true;
  return false;
}

export function formatKnowledgeFileRejectionError(file: File): string {
  return `Unsupported file type: ${file.name}. Accepted file types: ${KNOWLEDGE_ACCEPTED_FILE_TYPES_LABEL}.`;
}

/** File picker `accept` value for knowledge PDF upload. */
export const KNOWLEDGE_FILE_INPUT_ACCEPT = '.pdf,application/pdf';
