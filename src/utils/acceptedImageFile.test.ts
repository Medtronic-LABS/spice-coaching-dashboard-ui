import { describe, expect, it } from 'vitest';
import {
  formatImageRejectionError,
  IMAGE_FILE_INPUT_ACCEPT,
  isAcceptedImageFile,
} from '@/utils/acceptedImageFile';

function file(name: string, type = '', sizeBytes?: number): File {
  const contents =
    typeof sizeBytes === 'number' ? new Uint8Array(sizeBytes) : 'content';
  return new File([contents], name, { type });
}

describe('isAcceptedImageFile', () => {
  it('accepts PNG, JPEG, and WebP by MIME type or extension', () => {
    expect(isAcceptedImageFile(file('thumb.png', 'image/png'))).toBe(true);
    expect(isAcceptedImageFile(file('thumb.jpg', 'image/jpeg'))).toBe(true);
    expect(isAcceptedImageFile(file('thumb.jpeg', 'image/jpg'))).toBe(true);
    expect(isAcceptedImageFile(file('thumb.webp', 'image/webp'))).toBe(true);
    expect(isAcceptedImageFile(file('thumb.png'))).toBe(true);
    expect(isAcceptedImageFile(file('thumb.JPEG'))).toBe(true);
    expect(isAcceptedImageFile(file('download', 'image/png'))).toBe(true);
  });

  it('rejects AVIF, GIF, SVG, and other non-accepted images', () => {
    expect(isAcceptedImageFile(file('thumb.avif', 'image/avif'))).toBe(false);
    expect(isAcceptedImageFile(file('thumb.gif', 'image/gif'))).toBe(false);
    expect(isAcceptedImageFile(file('thumb.svg', 'image/svg+xml'))).toBe(false);
    expect(isAcceptedImageFile(file('notes.pdf', 'application/pdf'))).toBe(
      false,
    );
  });
});

describe('formatImageRejectionError', () => {
  it('lists the allowed formats without the filename', () => {
    expect(formatImageRejectionError(file('preview.avif', 'image/avif'))).toBe(
      'Unsupported format. Use PNG, JPEG, or WebP.',
    );
  });

  it('reports oversize when maxBytes is set', () => {
    const oversized = file('thumb.png', 'image/png', 6 * 1024 * 1024);
    expect(
      formatImageRejectionError(oversized, { maxBytes: 5 * 1024 * 1024 }),
    ).toBe('File exceeds the 5 MB image size limit.');
  });

  it('returns an empty string for an accepted file', () => {
    expect(
      formatImageRejectionError(file('thumb.webp', 'image/webp'), {
        accept: IMAGE_FILE_INPUT_ACCEPT,
      }),
    ).toBe('');
  });
});
