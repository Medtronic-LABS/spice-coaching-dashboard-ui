import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useKnowledgePdfDocument } from './useKnowledgePdfDocument';

const openPdfDocument = vi.fn();

vi.mock('@/features/modules/utils/pdfjsClient', () => ({
  openPdfDocument: (...args: unknown[]) => openPdfDocument(...args),
}));

describe('useKnowledgePdfDocument', () => {
  beforeEach(() => {
    openPdfDocument.mockReset();
  });

  it('loads page count from the selected PDF', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    openPdfDocument.mockResolvedValue({
      numPages: 7,
      destroy,
    } as unknown as PDFDocumentProxy);

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pageCount).toBe(7);
      expect(result.current.error).toBeNull();
    });
  });

  it('surfaces a readable error when PDF open fails', async () => {
    openPdfDocument.mockRejectedValue(new Error('bad pdf'));
    const file = new File(['x'], 'bad.pdf', { type: 'application/pdf' });
    const { result } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.pageCount).toBeNull();
      expect(result.current.error).toMatch(/could not read this pdf/i);
    });
  });

  it('destroys the opened document on unmount', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    openPdfDocument.mockResolvedValue({
      numPages: 3,
      destroy,
    } as unknown as PDFDocumentProxy);

    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result, unmount } = renderHook(() => useKnowledgePdfDocument(file));

    await waitFor(() => {
      expect(result.current.pageCount).toBe(3);
    });

    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(destroy).toHaveBeenCalled();
  });
});
