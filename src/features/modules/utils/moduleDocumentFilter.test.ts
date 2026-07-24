import { describe, expect, it } from 'vitest';
import {
  extensionFromFilename,
  sourceDocumentFilterLabel,
} from './moduleDocumentFilter';

describe('moduleDocumentFilter', () => {
  it('extensionFromFilename extracts a lowercased extension', () => {
    expect(extensionFromFilename('guide.PDF')).toBe('.pdf');
    expect(extensionFromFilename('path/to/video.mp4')).toBe('.mp4');
  });

  it('extensionFromFilename returns empty for missing or extensionless names', () => {
    expect(extensionFromFilename(null)).toBe('');
    expect(extensionFromFilename('')).toBe('');
    expect(extensionFromFilename('noext')).toBe('');
    expect(extensionFromFilename('.gitignore')).toBe('');
  });

  it('sourceDocumentFilterLabel prefers title', () => {
    expect(sourceDocumentFilterLabel('abc-def-ghi', 'Hypertension guide')).toBe(
      'Hypertension guide',
    );
  });

  it('sourceDocumentFilterLabel appends extension from original filename', () => {
    expect(
      sourceDocumentFilterLabel(
        'abc-def-ghi',
        'Hypertension guide',
        'htn_protocol.PDF',
      ),
    ).toBe('Hypertension guide (.pdf)');
  });

  it('sourceDocumentFilterLabel does not duplicate an extension already in the title', () => {
    expect(
      sourceDocumentFilterLabel(
        'abc-def-ghi',
        'Hypertension guide.pdf',
        'htn_protocol.pdf',
      ),
    ).toBe('Hypertension guide.pdf');
  });

  it('sourceDocumentFilterLabel falls back to a truncated id', () => {
    expect(sourceDocumentFilterLabel('abc-def-ghi-jkl')).toBe(
      'Document abc-def-',
    );
  });

  it('sourceDocumentFilterLabel can append extension to the id fallback', () => {
    expect(
      sourceDocumentFilterLabel('abc-def-ghi-jkl', undefined, 'notes.docx'),
    ).toBe('Document abc-def- (.docx)');
  });

  it('sourceDocumentFilterLabel ignores whitespace-only titles', () => {
    expect(sourceDocumentFilterLabel('abc-def-ghi-jkl', '   ')).toBe(
      'Document abc-def-',
    );
  });
});
