import type { RichImageBlock } from '@/components/ui/rich-text/types/richText.types';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';

export interface PreviewImageBlockProps {
  attrs: RichImageBlock['attrs'];
}

/**
 * Preview mirrors the editor display size when width is set, but keeps natural
 * aspect ratio (`height: auto`) so images are not cropped when the phone frame
 * is narrower than the stored pixel width.
 */
export const PreviewImageBlock = ({ attrs }: PreviewImageBlockProps) => {
  const { url, isLoading, isError } = usePresignedFileUrl(attrs.object_name, {
    legacyUrl: attrs.url,
  });
  const hasDisplayWidth = Boolean(attrs.width);

  return (
    <figure className="my-3 flex justify-center">
      <div
        className={
          hasDisplayWidth
            ? 'inline-block max-w-full'
            : 'relative w-full overflow-hidden rounded-lg bg-spice-bg-tint'
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
            draggable={false}
            className={
              hasDisplayWidth
                ? 'h-auto max-w-full rounded-lg object-contain'
                : 'h-auto max-h-[min(70vh,480px)] w-full rounded-lg object-contain'
            }
            style={
              hasDisplayWidth
                ? {
                    width: `${attrs.width}px`,
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
