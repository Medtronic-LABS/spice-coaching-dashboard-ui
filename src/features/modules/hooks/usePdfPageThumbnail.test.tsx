import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { usePdfPageThumbnail } from './usePdfPageThumbnail';

const renderPdfPageToObjectUrl = vi.fn();

vi.mock('@/features/modules/utils/pdfjsClient', () => ({
  renderPdfPageToObjectUrl: (...args: unknown[]) =>
    renderPdfPageToObjectUrl(...args),
}));

function stubUrlObjectApis() {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(() => 'blob:created'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
}

describe('usePdfPageThumbnail', () => {
  beforeEach(() => {
    renderPdfPageToObjectUrl.mockReset();
    stubUrlObjectApis();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a debounced object URL for an in-range page', async () => {
    renderPdfPageToObjectUrl.mockResolvedValue('blob:page-1');
    const pdf = { numPages: 4 } as PDFDocumentProxy;

    const { result, unmount } = renderHook(() =>
      usePdfPageThumbnail(pdf, 1, true),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.url).toBe('blob:page-1');
    expect(result.current.isRendering).toBe(false);
    expect(renderPdfPageToObjectUrl).toHaveBeenCalledWith(pdf, 1, {
      maxWidth: 180,
    });

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:page-1');
  });

  it('skips rendering when disabled', async () => {
    const pdf = { numPages: 2 } as PDFDocumentProxy;
    renderHook(() => usePdfPageThumbnail(pdf, 1, false));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(renderPdfPageToObjectUrl).not.toHaveBeenCalled();
  });

  it('skips rendering when page is out of range', async () => {
    const pdf = { numPages: 2 } as PDFDocumentProxy;
    renderHook(() => usePdfPageThumbnail(pdf, 9, true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(renderPdfPageToObjectUrl).not.toHaveBeenCalled();
  });
});
