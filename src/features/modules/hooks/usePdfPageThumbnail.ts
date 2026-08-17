import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { renderPdfPageToObjectUrl } from '@/features/modules/utils/pdfjsClient';

const THUMBNAIL_DEBOUNCE_MS = 200;
const DEFAULT_MAX_WIDTH = 180;

export interface UsePdfPageThumbnailResult {
  url: string | null;
  isRendering: boolean;
}

/**
 * Render a debounced PDF page preview as an object URL.
 * Skips work when disabled or when the page is out of range.
 */
export function usePdfPageThumbnail(
  pdf: PDFDocumentProxy | null,
  pageNumber: number | null | undefined,
  enabled: boolean,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): UsePdfPageThumbnailResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const debouncedPage = useDebouncedValue(
    pageNumber ?? null,
    THUMBNAIL_DEBOUNCE_MS,
  );

  useEffect(() => {
    if (
      !enabled ||
      !pdf ||
      debouncedPage === null ||
      !Number.isFinite(debouncedPage) ||
      debouncedPage < 1 ||
      debouncedPage > pdf.numPages
    ) {
      setIsRendering(false);
      setUrl(null);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setIsRendering(true);

    void (async () => {
      try {
        createdUrl = await renderPdfPageToObjectUrl(pdf, debouncedPage, {
          maxWidth,
        });
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        setUrl(createdUrl);
      } catch {
        if (createdUrl) URL.revokeObjectURL(createdUrl);
        if (!cancelled) setUrl(null);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedPage, enabled, maxWidth, pdf]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return { url, isRendering };
}
