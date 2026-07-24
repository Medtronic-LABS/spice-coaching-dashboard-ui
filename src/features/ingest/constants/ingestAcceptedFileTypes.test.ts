import { describe, expect, it } from 'vitest';
import {
  formatIngestFileRejectionError,
  isIngestAcceptedFile,
} from './ingestAcceptedFileTypes';

function file(name: string, type = ''): File {
  return new File(['content'], name, { type });
}

describe('isIngestAcceptedFile', () => {
  it('accepts supported extensions', () => {
    expect(isIngestAcceptedFile(file('module.pdf'))).toBe(true);
    expect(isIngestAcceptedFile(file('slides.pptx'))).toBe(true);
    expect(isIngestAcceptedFile(file('audio.mp3', 'audio/mpeg'))).toBe(true);
  });

  it('accepts supported MIME types when extension is missing', () => {
    expect(isIngestAcceptedFile(file('download', 'application/pdf'))).toBe(
      true,
    );
  });

  it('rejects unsupported image and text files', () => {
    expect(isIngestAcceptedFile(file('photo.jpeg', 'image/jpeg'))).toBe(false);
    expect(isIngestAcceptedFile(file('notes.md', 'text/markdown'))).toBe(false);
    expect(isIngestAcceptedFile(file('archive.zip'))).toBe(false);
  });

  it('rejects video files', () => {
    expect(isIngestAcceptedFile(file('video.mp4', 'video/mp4'))).toBe(false);
    expect(isIngestAcceptedFile(file('video.webm', 'video/webm'))).toBe(false);
    expect(isIngestAcceptedFile(file('movie.mov', 'video/quicktime'))).toBe(
      false,
    );
    expect(isIngestAcceptedFile(file('movie.mkv', 'video/x-matroska'))).toBe(
      false,
    );
  });
});

describe('formatIngestFileRejectionError', () => {
  it('lists rejected filenames and accepted types', () => {
    const message = formatIngestFileRejectionError([
      file('photo.jpeg'),
      file('notes.md'),
    ]);

    expect(message).toContain('photo.jpeg');
    expect(message).toContain('notes.md');
    expect(message).toContain('PDF, DOCX');
  });
});
