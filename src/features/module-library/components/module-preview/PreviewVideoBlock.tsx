import type { RichVideoBlock } from '@/features/program-manager/types/programManager.types';
import { usePresignedFileUrl } from '@/features/module-library/hooks/usePresignedFileUrl';

export interface PreviewVideoBlockProps {
  attrs: RichVideoBlock['attrs'];
}

export const PreviewVideoBlock = ({ attrs }: PreviewVideoBlockProps) => {
  const { url, isLoading, isError } = usePresignedFileUrl(attrs.object_name, {
    legacyUrl: attrs.url,
    disposition: 'inline',
  });

  const thumbnailObjectName = attrs.thumbnail?.trim();
  const { url: posterUrl } = usePresignedFileUrl(
    thumbnailObjectName && thumbnailObjectName !== attrs.object_name?.trim()
      ? thumbnailObjectName
      : undefined,
    { disposition: 'inline' },
  );

  return (
    <figure className="my-3">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-[#101828]">
        {isLoading ? (
          <div
            className="flex h-full w-full items-center justify-center text-xs text-white/70"
            role="status"
            aria-label="Loading video"
          >
            Loading video…
          </div>
        ) : null}
        {!isLoading && url ? (
          <video
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            poster={posterUrl ?? undefined}
            aria-label="Video"
          >
            <source src={url} type={attrs.content_type ?? undefined} />
            Your browser does not support video playback.
          </video>
        ) : null}
        {!isLoading && (!url || isError) ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-white/70">
            Video unavailable
          </div>
        ) : null}
      </div>
    </figure>
  );
};
