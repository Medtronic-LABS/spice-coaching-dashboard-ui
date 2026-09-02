import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  destroyPdfDocument,
  openPdfDocument,
} from '@/features/modules/utils/pdfjsClient';

export interface KnowledgePdfDocumentState {
  pdf: PDFDocumentProxy | null;
  pageCount: number | null;
  isLoading: boolean;
  warning: string | null;
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
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setPageCount(null);
      setIsLoading(false);
      setWarning(null);
      return;
    }

    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;

    setIsLoading(true);
    setWarning(null);
    setPdf(null);
    setPageCount(null);

    void (async () => {
      try {
        opened = await openPdfDocument(file);
        if (cancelled) {
          await destroyPdfDocument(opened);
          opened = null;
          return;
        }
        setPdf(opened);
        setPageCount(opened.numPages);
      } catch {
        if (opened) {
          try {
            await destroyPdfDocument(opened);
          } catch {
            // ignore destroy errors after a failed open path
          }
          opened = null;
        }
        if (!cancelled) {
          setPdf(null);
          setPageCount(null);
          setWarning(
            "Couldn't preview this PDF in your browser. You can still upload it; if you're splitting the document, page ranges will be checked on upload.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (opened) {
        void destroyPdfDocument(opened);
        opened = null;
      }
    };
  }, [file]);

  return { pdf, pageCount, isLoading, warning };
}
