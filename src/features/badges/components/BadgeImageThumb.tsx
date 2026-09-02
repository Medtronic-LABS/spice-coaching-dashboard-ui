import { useEffect, useState } from 'react';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { objectNameFromStoragePath } from '@/features/badges/utils/badgeForm';
import { cn } from '@/utils';

interface BadgeImageThumbProps {
  storagePath: string;
  objectName?: string | null;
  alt: string;
  className?: string;
}

function NoBadgeFallback({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center text-center text-[10px] leading-tight text-spice-text-muted',
        className,
      )}
      title={title}
    >
      No Badge
    </span>
  );
}

function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-10 w-10 animate-pulse rounded-md bg-spice-bg-tint',
        className,
      )}
      aria-label="Loading milestone image"
      data-testid="badge-image-skeleton"
    />
  );
}

export const BadgeImageThumb = ({
  storagePath,
  objectName,
  alt,
  className,
}: BadgeImageThumbProps) => {
  const resolvedObjectName =
    objectName?.trim() || objectNameFromStoragePath(storagePath);
  const { url, isLoading, isError } = usePresignedFileUrl(
    resolvedObjectName || null,
  );
  const [imageStatus, setImageStatus] = useState<
    'loading' | 'loaded' | 'error'
  >('loading');

  // Reset only when the object changes — not when a refreshed presigned URL
  // string arrives (that was flashing table thumbs when the modal mounted).
  useEffect(() => {
    setImageStatus('loading');
  }, [resolvedObjectName]);

  if (!resolvedObjectName) {
    return <NoBadgeFallback className={className} />;
  }

  if (isError || (!isLoading && !url) || imageStatus === 'error') {
    return (
      <NoBadgeFallback className={className} title={storagePath || undefined} />
    );
  }

  if (isLoading || !url) {
    return <ImageSkeleton className={className} />;
  }

  return (
    <div
      className={cn(
        'relative h-10 w-10 overflow-hidden rounded-md border border-spice-border',
        className,
      )}
    >
      {imageStatus === 'loading' ? (
        <div
          className="absolute inset-0 z-10 animate-pulse bg-spice-bg-tint"
          aria-label="Loading milestone image"
          data-testid="badge-image-skeleton"
        />
      ) : null}
      <img
        src={url}
        alt={alt}
        draggable={false}
        onLoad={() => setImageStatus('loaded')}
        onError={() => setImageStatus('error')}
        className={cn(
          'h-full w-full object-contain',
          imageStatus !== 'loaded' && 'invisible',
        )}
      />
    </div>
  );
};
