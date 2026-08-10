import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeThumbnailCell } from '@/features/modules/components/KnowledgeThumbnailCell';
import { renderWithProviders } from '@/test-utils/render';

const usePresignedFileUrlMock = vi.fn();

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: (objectName: string | null | undefined) =>
    usePresignedFileUrlMock(objectName),
}));

describe('KnowledgeThumbnailCell', () => {
  beforeEach(() => {
    usePresignedFileUrlMock.mockReset();
    usePresignedFileUrlMock.mockImplementation(
      (objectName: string | null | undefined) => ({
        url: objectName
          ? `https://cdn.example.test/${encodeURIComponent(objectName)}`
          : null,
        isLoading: false,
        isError: false,
        objectName: objectName ?? null,
        error: undefined,
      }),
    );
  });

  it('shows an em dash and does not request a presign when path is missing', () => {
    renderWithProviders(<KnowledgeThumbnailCell storagePath={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(usePresignedFileUrlMock).toHaveBeenCalledWith(null);
  });

  it('does not request a presign while the cell is off-screen', () => {
    class OffscreenObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', OffscreenObserver);

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/doc.png" />,
    );

    expect(
      screen.getByTestId('knowledge-thumbnail-placeholder'),
    ).toBeInTheDocument();
    expect(usePresignedFileUrlMock).toHaveBeenCalledWith(null);
  });

  it('requests a presign and renders the image once near the viewport', async () => {
    class ImmediateObserver {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        this.callback(
          [
            {
              isIntersecting: true,
              target,
              intersectionRatio: 1,
              time: 0,
              boundingClientRect: {} as DOMRectReadOnly,
              intersectionRect: {} as DOMRectReadOnly,
              rootBounds: null,
            },
          ],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', ImmediateObserver);

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/doc.png" />,
    );

    await waitFor(() => {
      expect(usePresignedFileUrlMock).toHaveBeenCalledWith(
        'thumbnails/doc.png',
      );
    });

    const img = await waitFor(() => {
      const node = document.querySelector('img');
      expect(node).not.toBeNull();
      return node as HTMLImageElement;
    });
    expect(img).toHaveAttribute(
      'src',
      'https://cdn.example.test/thumbnails%2Fdoc.png',
    );
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
