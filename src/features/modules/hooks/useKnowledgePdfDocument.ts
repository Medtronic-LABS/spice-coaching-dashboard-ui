import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { openPdfDocument } from '@/features/modules/utils/pdfjsClient';

export interface KnowledgePdfDocumentState {
  pdf: PDFDocumentProxy | null;
  pageCount: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Lazily open a selected PDF once for page-count + thumbnail rendering.
 * Destroys the document when the file changes or the hook unmounts.
 */
export function useKnowledgePdfDocument(
  file: File | null,
): KnowledgePdfDocumentState {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setPageCount(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;

    setIsLoading(true);
    setError(null);
    setPdf(null);
    setPageCount(null);

    void (async () => {
      try {
        opened = await openPdfDocument(file);
        if (cancelled) {
          await opened.destroy();
          return;
        }
        setPdf(opened);
        setPageCount(opened.numPages);
      } catch {
        if (opened) {
          try {
            await opened.destroy();
          } catch {
            // ignore destroy errors after a failed open path
          }
          opened = null;
        }
        if (!cancelled) {
          setPdf(null);
          setPageCount(null);
          setError(
            'Could not read this PDF. Page ranges will be validated on upload.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (opened) {
        void opened.destroy();
        opened = null;
      }
    };
  }, [file]);

  return { pdf, pageCount, isLoading, error };
}
