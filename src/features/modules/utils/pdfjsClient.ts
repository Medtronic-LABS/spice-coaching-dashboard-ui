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

      // PDF.js loads its worker as a *module* (`type: "module"`). Some QA/CDN
      // setups serve the `.mjs` worker with an invalid Content-Type
      // (often `application/octet-stream`), which causes browsers to reject it.
      //
      // We avoid breaking local by only applying the workaround when we
      // detect a bad Content-Type at runtime.
      const workerUrl: string = worker.default;

      const looksLikeJsMime = (contentType: string | null): boolean => {
        if (!contentType) return false;
        const ct = contentType.toLowerCase();
        return (
          ct.includes('javascript') ||
          ct.includes('ecmascript') ||
          ct.includes('text/javascript') ||
          ct.includes('+javascript')
        );
      };

      try {
        const res = await fetch(workerUrl);
        const contentType = res.headers.get('content-type');

        if (res.ok && !looksLikeJsMime(contentType)) {
          // Use GlobalWorkerOptions.workerPort so PDF.js doesn't wrap the
          // (blob:) URL through its CDN wrapper logic.
          const bytes = await res.arrayBuffer();
          const blob = new Blob([bytes], { type: 'text/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          const workerPort = new Worker(blobUrl, { type: 'module' });
          pdfjs.GlobalWorkerOptions.workerPort = workerPort;
        } else {
          pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        }
      } catch {
        // If the probe fails (offline, CSP, etc.), fall back to default.
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      }

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
