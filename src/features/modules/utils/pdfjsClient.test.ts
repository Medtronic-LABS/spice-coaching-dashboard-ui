import { describe, expect, it } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPdfPageToObjectUrl } from './pdfjsClient';

describe('renderPdfPageToObjectUrl', () => {
  it('rejects page numbers outside the document range', async () => {
    const pdf = { numPages: 3 } as PDFDocumentProxy;

    await expect(renderPdfPageToObjectUrl(pdf, 0)).rejects.toThrow(
      /out of range/i,
    );
    await expect(renderPdfPageToObjectUrl(pdf, 4)).rejects.toThrow(
      /out of range/i,
    );
  });
});
