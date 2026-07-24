import type { RichImageBlock } from '@/features/modules/types/richText.types';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';

export interface PreviewImageBlockProps {
  attrs: RichImageBlock['attrs'];
}

export const PreviewImageBlock = ({ attrs }: PreviewImageBlockProps) => {
  const { url, isLoading, isError } = usePresignedFileUrl(attrs.object_name, {
    legacyUrl: attrs.url,
  });
  const hasDisplayDimensions = Boolean(attrs.width && attrs.height);

  return (
    <figure className="my-3">
      <div
        className={
          hasDisplayDimensions
            ? 'inline-block max-w-full'
            : 'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-spice-bg-tint'
        }
      >
        {isLoading ? (
          <div
            className="flex h-full min-h-[120px] items-center justify-center text-xs text-spice-text-muted"
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
            className={
              hasDisplayDimensions
                ? 'max-w-full rounded-lg object-contain'
                : 'h-full w-full object-contain'
            }
            style={
              hasDisplayDimensions
                ? {
                    width: `${attrs.width}px`,
                    height: `${attrs.height}px`,
                  }
                : undefined
            }
          />
        ) : null}
        {!isLoading && (!url || isError) ? (
          <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-xs text-spice-text-muted">
            Image unavailable
          </div>
        ) : null}
      </div>
    </figure>
  );
};
