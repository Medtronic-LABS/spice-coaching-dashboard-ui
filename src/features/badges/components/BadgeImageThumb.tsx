import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { objectNameFromStoragePath } from '@/features/badges/utils/badgeForm';
import { cn } from '@/utils';

interface BadgeImageThumbProps {
  storagePath: string;
  objectName?: string | null;
  alt: string;
  className?: string;
}

export const BadgeImageThumb = ({
  storagePath,
  objectName,
  alt,
  className,
}: BadgeImageThumbProps) => {
  const resolvedObjectName =
    objectName?.trim() || objectNameFromStoragePath(storagePath);
  const { url, isLoading } = usePresignedFileUrl(resolvedObjectName || null);

  if (!resolvedObjectName) {
    return (
      <span className="text-xs text-spice-text-muted" aria-hidden="true">
        —
      </span>
    );
  }

  if (isLoading && !url) {
    return (
      <div
        className={cn(
          'h-10 w-10 animate-pulse rounded-md bg-spice-bg-tint',
          className,
        )}
        aria-label="Loading badge image"
      />
    );
  }

  if (!url) {
    return (
      <span className="text-xs text-spice-text-muted" title={storagePath}>
        —
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={cn(
        'h-10 w-10 rounded-md border border-spice-border object-cover',
        className,
      )}
    />
  );
};
