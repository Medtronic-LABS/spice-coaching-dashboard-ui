export const VIDEO_ACCEPTED_FILE_TYPES_LABEL = 'MP4, MOV, MKV, WEBM';

const VIDEO_ACCEPTED_EXTENSIONS = new Set(['mp4', 'mov', 'mkv', 'webm']);

const VIDEO_ACCEPTED_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
]);

function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return '';
  return trimmed.slice(lastDot + 1);
}

export function isAcceptedVideoFile(file: File): boolean {
  const extension = fileExtension(file.name);
  if (extension && VIDEO_ACCEPTED_EXTENSIONS.has(extension)) return true;
  return Boolean(file.type && VIDEO_ACCEPTED_MIME_TYPES.has(file.type));
}

export function formatVideoFileRejectionError(file: File): string {
  return `Unsupported file type: ${file.name}. Accepted file types: ${VIDEO_ACCEPTED_FILE_TYPES_LABEL}.`;
}

export const VIDEO_FILE_INPUT_ACCEPT =
  '.mp4,.mov,.mkv,.webm,video/mp4,video/quicktime,video/x-matroska,video/webm';
