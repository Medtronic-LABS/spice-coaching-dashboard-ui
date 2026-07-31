import type { PDFDocumentProxy } from 'pdfjs-dist';

type PdfjsModule = typeof import('pdfjs-dist');

let pdfjsLoadPromise: Promise<PdfjsModule> | null = null;

/**
 * Lazily load pdfjs-dist + worker only when a knowledge PDF is selected.
 * Keeps the library out of the main app bundle until needed.
 */
export async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsLoadPromise) {
    pdfjsLoadPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsLoadPromise;
}

/** Open a local PDF file as a PDF.js document (caller must destroy when done). */
export async function openPdfDocument(file: File): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

/**
 * Tear down a PDF.js document.
 * pdfjs-dist v6 removed `PDFDocumentProxy.destroy()`; destroy lives on `loadingTask`.
 */
export async function destroyPdfDocument(
  pdf: PDFDocumentProxy | null | undefined,
): Promise<void> {
  if (!pdf) return;
  await pdf.loadingTask.destroy();
}

export interface RenderPdfPageOptions {
  /** Cap thumbnail width in CSS pixels (default 180). */
  maxWidth?: number;
}

/**
 * Render a single PDF page to an object URL (PNG).
 * Caller must revoke the URL when finished.
 */
export async function renderPdfPageToObjectUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  options: RenderPdfPageOptions = {},
): Promise<string> {
  if (
    !Number.isFinite(pageNumber) ||
    pageNumber < 1 ||
    pageNumber > pdf.numPages
  ) {
    throw new Error(
      `Page ${pageNumber} is out of range for this PDF (${pdf.numPages} pages).`,
    );
  }

  const maxWidth = options.maxWidth ?? 180;
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) {
    throw new Error('Unable to create canvas context for PDF thumbnail.');
  }

  await page.render({
    canvas,
    canvasContext,
    viewport,
  }).promise;

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PDF thumbnail blob.'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}
