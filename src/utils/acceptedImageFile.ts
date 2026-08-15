/** File picker `accept` for PNG / JPEG / WebP image uploads. */
export const IMAGE_FILE_INPUT_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/webp';

const DISPLAY_LABEL_BY_EXTENSION: Record<string, string> = {
  png: 'PNG',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  webp: 'WebP',
  gif: 'GIF',
  avif: 'AVIF',
  svg: 'SVG',
  bmp: 'BMP',
};

function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return '';
  return trimmed.slice(lastDot + 1);
}

function bytesToMbLabel(maxBytes: number): string {
  return String(Math.round(maxBytes / (1024 * 1024)));
}

function parseImageAccept(accept: string): {
  mimes: Set<string>;
  extensions: Set<string>;
} {
  const mimes = new Set<string>();
  const extensions = new Set<string>();

  for (const raw of accept.split(',')) {
    const token = raw.trim().toLowerCase();
    if (!token) continue;

    if (token.startsWith('.')) {
      extensions.add(token.slice(1));
      continue;
    }

    mimes.add(token);
    if (token === 'image/jpeg' || token === 'image/jpg') {
      mimes.add('image/jpeg');
      mimes.add('image/jpg');
      extensions.add('jpg');
      extensions.add('jpeg');
      continue;
    }

    if (token.startsWith('image/')) {
      const subtype = token.slice('image/'.length);
      if (subtype && !subtype.includes('*')) {
        extensions.add(subtype);
      }
    }
  }

  return { mimes, extensions };
}

function formatAcceptedImageLabel(accept: string): string {
  const { extensions } = parseImageAccept(accept);
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const extension of extensions) {
    const label =
      DISPLAY_LABEL_BY_EXTENSION[extension] ?? extension.toUpperCase();
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }

  if (labels.length === 0) return 'PNG, JPEG, or WebP';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`;
}

export function isAcceptedImageFile(
  file: File,
  accept: string = IMAGE_FILE_INPUT_ACCEPT,
): boolean {
  const { mimes, extensions } = parseImageAccept(accept);
  const type = file.type.trim().toLowerCase();
  if (type && mimes.has(type)) return true;
  const extension = fileExtension(file.name);
  return Boolean(extension && extensions.has(extension));
}

export function formatImageRejectionError(
  file: File,
  options?: { accept?: string; maxBytes?: number },
): string {
  const accept = options?.accept ?? IMAGE_FILE_INPUT_ACCEPT;
  if (!isAcceptedImageFile(file, accept)) {
    return `Unsupported format. Use ${formatAcceptedImageLabel(accept)}.`;
  }
  const maxBytes = options?.maxBytes;
  if (typeof maxBytes === 'number' && file.size > maxBytes) {
    return `File exceeds the ${bytesToMbLabel(maxBytes)} MB image size limit.`;
  }
  return '';
}
