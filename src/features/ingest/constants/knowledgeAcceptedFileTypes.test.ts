import { describe, expect, it } from 'vitest';
import {
  formatKnowledgeFileRejectionError,
  isKnowledgeAcceptedFile,
} from './knowledgeAcceptedFileTypes';

function file(name: string, type = ''): File {
  return new File(['content'], name, { type });
}

describe('isKnowledgeAcceptedFile', () => {
  it('accepts PDF by extension or MIME type', () => {
    expect(isKnowledgeAcceptedFile(file('guide.pdf'))).toBe(true);
    expect(isKnowledgeAcceptedFile(file('guide', 'application/pdf'))).toBe(
      true,
    );
  });

  it('rejects non-PDF files', () => {
    expect(isKnowledgeAcceptedFile(file('deck.pptx'))).toBe(false);
    expect(isKnowledgeAcceptedFile(file('notes.docx'))).toBe(false);
    expect(isKnowledgeAcceptedFile(file('clip.mp4', 'video/mp4'))).toBe(false);
  });

  it('formats a useful rejection message', () => {
    const message = formatKnowledgeFileRejectionError(file('deck.pptx'));
    expect(message).toContain('deck.pptx');
    expect(message).toContain('PDF');
  });
});
