import { useEffect, useRef, useState } from 'react';
import { usePresignedFileUrl } from '@/features/modules/hooks/usePresignedFileUrl';

const THUMB_BOX_CLASS =
  'flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-spice-border bg-spice-bg-tint';

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

export function KnowledgeThumbnailCell({
  storagePath,
}: {
  storagePath: string | null;
}) {
  const hasPath = Boolean(storagePath?.trim());
  const { ref, isNear } = useNearViewport(hasPath);
  const { url } = usePresignedFileUrl(hasPath && isNear ? storagePath : null);

  if (!hasPath) {
    return <span className="text-xs text-spice-text-muted">—</span>;
  }

  if (!isNear || !url) {
    return (
      <div
        ref={ref}
        className={THUMB_BOX_CLASS}
        aria-hidden={!isNear}
        data-testid="knowledge-thumbnail-placeholder"
      >
        <span className="text-xs text-spice-text-muted">…</span>
      </div>
    );
  }

  return (
    <div className={THUMB_BOX_CLASS}>
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
