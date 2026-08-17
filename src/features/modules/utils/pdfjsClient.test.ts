import { describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { destroyPdfDocument, renderPdfPageToObjectUrl } from './pdfjsClient';

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

describe('destroyPdfDocument', () => {
  it('no-ops when the document is missing', async () => {
    await expect(destroyPdfDocument(null)).resolves.toBeUndefined();
    await expect(destroyPdfDocument(undefined)).resolves.toBeUndefined();
  });

  it('destroys via loadingTask (pdfjs v6 API)', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    const pdf = {
      loadingTask: { destroy },
    } as unknown as PDFDocumentProxy;

    await destroyPdfDocument(pdf);

    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
