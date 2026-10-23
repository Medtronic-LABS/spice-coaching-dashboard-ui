import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useKnowledgePdfDocument } from './useKnowledgePdfDocument';

const openPdfDocument = vi.fn();
const destroyPdfDocument = vi.fn();

vi.mock('@/features/modules/utils/pdfjsClient', () => ({
  openPdfDocument: (...args: unknown[]) => openPdfDocument(...args),
  destroyPdfDocument: (...args: unknown[]) => destroyPdfDocument(...args),
}));

function mockPdf(numPages: number): PDFDocumentProxy {
  return { numPages } as unknown as PDFDocumentProxy;
}

describe('useKnowledgePdfDocument', () => {
  beforeEach(() => {
    openPdfDocument.mockReset();
    destroyPdfDocument.mockReset();
    destroyPdfDocument.mockResolvedValue(undefined);
  });

  it('loads page count from the selected PDF', async () => {
    openPdfDocument.mockResolvedValue(mockPdf(7));

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pageCount).toBe(7);
      expect(result.current.warning).toBeNull();
    });
  });

  it('surfaces a preview warning when PDF open fails', async () => {
    openPdfDocument.mockRejectedValue(new Error('bad pdf'));
    const file = new File(['x'], 'bad.pdf', { type: 'application/pdf' });
    const { result } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pageCount).toBeNull();
      expect(result.current.warning).toMatch(/couldn't preview this pdf/i);
    });
  });

  it('destroys the opened document on unmount', async () => {
    const pdf = mockPdf(3);
    openPdfDocument.mockResolvedValue(pdf);

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result, unmount } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.pageCount).toBe(3);
    });

    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(destroyPdfDocument).toHaveBeenCalledWith(pdf);
  });

  it('destroys the opened document when the selected file is cleared', async () => {
    const pdf = mockPdf(2);
    openPdfDocument.mockResolvedValue(pdf);

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result, rerender } = renderHook(
      ({ selected }: { selected: File | null }) =>
        useKnowledgePdfDocument(selected),
      { initialProps: { selected: file } },
    );

    await waitFor(() => {
      expect(result.current.pageCount).toBe(2);
    });

    rerender({ selected: null });
    await waitFor(() => {
      expect(result.current.pdf).toBeNull();
      expect(result.current.pageCount).toBeNull();
    });
    expect(destroyPdfDocument).toHaveBeenCalledWith(pdf);
  });
});
