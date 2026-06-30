import type { RichImageBlock } from '@/features/program-manager/types/programManager.types';
import { usePresignedFileUrl } from '@/features/module-library/hooks/usePresignedFileUrl';

export interface PreviewImageBlockProps {
  attrs: RichImageBlock['attrs'];
}

export const PreviewImageBlock = ({ attrs }: PreviewImageBlockProps) => {
  const { url, isLoading, isError } = usePresignedFileUrl(attrs.object_name, {
    legacyUrl: attrs.url,
  });

  return (
    <figure className="my-3">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-spice-bg-tint">
        {isLoading ? (
          <div
            className="flex h-full items-center justify-center text-xs text-spice-text-muted"
            role="status"
            aria-label="Loading image"
          >
            Loading image…
          </div>
        ) : null}
        {!isLoading && url ? (
          <img
            src={url}
            alt="Lesson image"
            className="h-full w-full object-contain"
          />
        ) : null}
        {!isLoading && (!url || isError) ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-spice-text-muted">
            Image unavailable
          </div>
        ) : null}
      </div>
    </figure>
  );
};
