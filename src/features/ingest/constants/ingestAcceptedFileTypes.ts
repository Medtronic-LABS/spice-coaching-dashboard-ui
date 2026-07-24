/** Human-readable extensions shown in ingest upload UI. */
export const INGEST_ACCEPTED_FILE_TYPES_LABEL =
  'PDF, DOCX, PPT, PPTX, MP3, WAV, M4A, FLAC, OGG';

const INGEST_ACCEPTED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'ppt',
  'pptx',
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ogg',
]);

const INGEST_ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/flac',
  'audio/ogg',
]);

function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return '';
  return trimmed.slice(lastDot + 1);
}

/** Whether a picked file matches ingest-supported extensions or MIME types. */
export function isIngestAcceptedFile(file: File): boolean {
  const extension = fileExtension(file.name);
  if (extension && INGEST_ACCEPTED_EXTENSIONS.has(extension)) return true;
  if (file.type && INGEST_ACCEPTED_MIME_TYPES.has(file.type)) return true;
  return false;
}

export function formatIngestFileRejectionError(rejected: File[]): string {
  const names = rejected.map((file) => file.name).join(', ');
  return `Unsupported file type: ${names}. Accepted file types: ${INGEST_ACCEPTED_FILE_TYPES_LABEL}.`;
}

/** File picker `accept` value for admin ingest. */
export const INGEST_FILE_INPUT_ACCEPT =
  '.pdf,.docx,.ppt,.pptx,' +
  '.mp3,.wav,.m4a,.flac,.ogg,' +
  'application/pdf,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-powerpoint,' +
  'application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'audio/mpeg,' +
  'audio/wav,' +
  'audio/x-wav,' +
  'audio/mp4,' +
  'audio/x-m4a,' +
  'audio/flac,' +
  'audio/ogg';
