import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeThumbnailCell } from '@/features/modules/components/KnowledgeThumbnailCell';
import { renderWithProviders } from '@/test-utils/render';

const usePresignedFileUrlMock = vi.fn();

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: (objectName: string | null | undefined) =>
    usePresignedFileUrlMock(objectName),
}));

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

class OffscreenObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

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

  it('shows No Thumbnail and does not request a presign when path is missing', () => {
    renderWithProviders(<KnowledgeThumbnailCell storagePath={null} />);
    expect(screen.getByText('No Thumbnail')).toBeInTheDocument();
    expect(usePresignedFileUrlMock).toHaveBeenCalledWith(null);
  });

  it('shows a skeleton and does not request a presign while off-screen', () => {
    vi.stubGlobal('IntersectionObserver', OffscreenObserver);

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/doc.png" />,
    );

    expect(
      screen.getByTestId('knowledge-thumbnail-skeleton'),
    ).toBeInTheDocument();
    expect(usePresignedFileUrlMock).toHaveBeenCalledWith(null);
  });

  it('shows a skeleton while the image is loading', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateObserver);

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/doc.png" />,
    );

    await waitFor(() => {
      expect(usePresignedFileUrlMock).toHaveBeenCalledWith(
        'thumbnails/doc.png',
      );
    });

    expect(
      screen.getByTestId('knowledge-thumbnail-skeleton'),
    ).toBeInTheDocument();

    const img = await waitFor(() => {
      const node = document.querySelector('img');
      expect(node).not.toBeNull();
      return node as HTMLImageElement;
    });
    expect(img).toHaveClass('invisible');

    fireEvent.load(img);

    expect(
      screen.queryByTestId('knowledge-thumbnail-skeleton'),
    ).not.toBeInTheDocument();
    expect(img).not.toHaveClass('invisible');
  });

  it('requests a presign and renders the image once near the viewport', async () => {
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

    fireEvent.load(img);
    expect(img).not.toHaveClass('invisible');
  });

  it('shows No Thumbnail when the presigned URL request fails', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateObserver);
    usePresignedFileUrlMock.mockImplementation(
      (objectName: string | null | undefined) => ({
        url: null,
        isLoading: false,
        isError: Boolean(objectName),
        objectName: objectName ?? null,
        error: undefined,
      }),
    );

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/missing.png" />,
    );

    await waitFor(() => {
      expect(screen.getByText('No Thumbnail')).toBeInTheDocument();
    });
  });

  it('shows No Thumbnail when the image fails to load', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateObserver);

    renderWithProviders(
      <KnowledgeThumbnailCell storagePath="thumbnails/broken.png" />,
    );

    const img = await waitFor(() => {
      const node = document.querySelector('img');
      expect(node).not.toBeNull();
      return node as HTMLImageElement;
    });

    fireEvent.error(img);

    expect(screen.getByText('No Thumbnail')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
