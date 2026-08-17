import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import { renderWithProviders } from '@/test-utils/render';

const usePresignedFileUrlMock = vi.fn();

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: (objectName: string | null | undefined) =>
    usePresignedFileUrlMock(objectName),
}));

describe('BadgeImageThumb', () => {
  beforeEach(() => {
    usePresignedFileUrlMock.mockReset();
  });

  it('shows No Badge when storage path is missing', () => {
    usePresignedFileUrlMock.mockReturnValue({
      url: null,
      isLoading: false,
      isError: false,
      objectName: null,
      error: undefined,
    });

    renderWithProviders(
      <BadgeImageThumb storagePath="" alt="Empty milestone" />,
    );

    expect(screen.getByText('No Badge')).toBeInTheDocument();
    expect(usePresignedFileUrlMock).toHaveBeenCalledWith(null);
  });

  it('shows a skeleton while the presigned URL is loading', () => {
    usePresignedFileUrlMock.mockReturnValue({
      url: null,
      isLoading: true,
      isError: false,
      objectName: 'badges/safe.png',
      error: undefined,
    });

    renderWithProviders(
      <BadgeImageThumb
        storagePath="microcoaching-uploads/badges/safe.png"
        alt="Safe milestone"
      />,
    );

    expect(screen.getByTestId('badge-image-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('No Badge')).not.toBeInTheDocument();
  });

  it('keeps the skeleton until the image finishes loading', () => {
    usePresignedFileUrlMock.mockReturnValue({
      url: 'https://cdn.example.test/badges/safe.png',
      isLoading: false,
      isError: false,
      objectName: 'badges/safe.png',
      error: undefined,
    });

    renderWithProviders(
      <BadgeImageThumb
        storagePath="microcoaching-uploads/badges/safe.png"
        alt="Safe milestone"
      />,
    );

    expect(screen.getByTestId('badge-image-skeleton')).toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'Safe milestone' });
    expect(img).toHaveAttribute('draggable', 'false');
    expect(img).toHaveClass('invisible');

    fireEvent.load(img);

    expect(
      screen.queryByTestId('badge-image-skeleton'),
    ).not.toBeInTheDocument();
    expect(img).not.toHaveClass('invisible');
  });

  it('shows No Badge when the presigned URL request fails', () => {
    usePresignedFileUrlMock.mockReturnValue({
      url: null,
      isLoading: false,
      isError: true,
      objectName: 'badges/missing.png',
      error: undefined,
    });

    renderWithProviders(
      <BadgeImageThumb
        storagePath="microcoaching-uploads/badges/missing.png"
        alt="Missing milestone"
      />,
    );

    expect(screen.getByText('No Badge')).toBeInTheDocument();
  });

  it('shows No Badge when the image fails to load', () => {
    usePresignedFileUrlMock.mockReturnValue({
      url: 'https://cdn.example.test/badges/broken.png',
      isLoading: false,
      isError: false,
      objectName: 'badges/broken.png',
      error: undefined,
    });

    renderWithProviders(
      <BadgeImageThumb
        storagePath="microcoaching-uploads/badges/broken.png"
        alt="Broken milestone"
      />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Broken milestone' }));

    expect(screen.getByText('No Badge')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
