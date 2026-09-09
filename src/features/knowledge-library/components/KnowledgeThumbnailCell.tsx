import { useEffect, useRef, useState, type Ref } from 'react';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';
import { cn } from '@/utils';

const THUMB_BOX_CLASS =
  'relative flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint';

const NEAR_VIEWPORT_ROOT_MARGIN = '200px';

function useNearViewport(enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    if (!enabled || isNear) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: NEAR_VIEWPORT_ROOT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, isNear]);

  return { ref, isNear };
}

function NoThumbnailFallback() {
  return (
    <span className="text-xs text-spice-text-muted" data-testid="no-thumbnail">
      No Thumbnail
    </span>
  );
}

function ThumbnailSkeleton({
  skeletonRef,
  ariaHidden,
}: {
  skeletonRef?: Ref<HTMLDivElement>;
  ariaHidden?: boolean;
}) {
  return (
    <div
      ref={skeletonRef}
      className={cn(THUMB_BOX_CLASS, 'animate-pulse')}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : 'Loading thumbnail'}
      data-testid="knowledge-thumbnail-skeleton"
    />
  );
}

export function KnowledgeThumbnailCell({
  storagePath,
}: {
  storagePath: string | null;
}) {
  const hasPath = Boolean(storagePath?.trim());
  const { ref, isNear } = useNearViewport(hasPath);
  const { url, isLoading, isError } = usePresignedFileUrl(
    hasPath && isNear ? storagePath : null,
  );
  const [imageStatus, setImageStatus] = useState<
    'loading' | 'loaded' | 'error'
  >('loading');

  useEffect(() => {
    setImageStatus('loading');
  }, [url]);

  if (!hasPath) {
    return <NoThumbnailFallback />;
  }

  if (isError || (isNear && !isLoading && !url) || imageStatus === 'error') {
    return <NoThumbnailFallback />;
  }

  if (!isNear || isLoading || !url) {
    return <ThumbnailSkeleton skeletonRef={ref} ariaHidden={!isNear} />;
  }

  return (
    <div className={THUMB_BOX_CLASS}>
      {imageStatus === 'loading' ? (
        <div
          className="absolute inset-0 z-10 animate-pulse bg-spice-bg-tint"
          aria-label="Loading thumbnail"
          data-testid="knowledge-thumbnail-skeleton"
        />
      ) : null}
      <img
        src={url}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageStatus('loaded')}
        onError={() => setImageStatus('error')}
        className={cn(
          'h-full w-full object-contain',
          imageStatus !== 'loaded' && 'invisible',
        )}
      />
    </div>
  );
}
