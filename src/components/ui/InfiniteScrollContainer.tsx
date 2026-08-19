import { useEffect, useRef, type ReactNode, type UIEventHandler } from 'react';
import { cn } from '@/utils';

/**
 * InfiniteScrollContainer
 * Scrollable region that calls `onLoadMore` when a bottom sentinel enters view.
 * Parents own pagination state (`hasMore`, `isLoadingMore`, item accumulation).
 *
 * Pass `loadedCount` (e.g. currently rendered item count) so the observer
 * re-attaches after each successful load while the sentinel remains visible.
 */
export interface InfiniteScrollContainerProps {
  children: ReactNode;
  /** Whether more items can be loaded. */
  hasMore: boolean;
  /** Invoked when the sentinel intersects the scroll root. */
  onLoadMore: () => void;
  /** Currently rendered item count — used to re-arm the observer after loads. */
  loadedCount: number;
  /** Disables further load triggers while a fetch/append is in flight. */
  isLoadingMore?: boolean;
  /** Shows a retry affordance instead of the loading row. */
  error?: boolean;
  onRetry?: () => void;
  className?: string;
  /** IntersectionObserver rootMargin (e.g. "40px" to prefetch early). */
  rootMargin?: string;
  loadingMessage?: string;
  errorMessage?: string;
  retryLabel?: string;
  /** When true, never calls onLoadMore (e.g. initial full-list loading). */
  disabled?: boolean;
  onScroll?: UIEventHandler<HTMLDivElement>;
}

export const InfiniteScrollContainer = ({
  children,
  hasMore,
  onLoadMore,
  loadedCount,
  isLoadingMore = false,
  error = false,
  onRetry,
  className,
  rootMargin = '0px',
  loadingMessage = 'Loading more…',
  errorMessage = 'Failed to load more.',
  retryLabel = 'Retry',
  disabled = false,
  onScroll,
}: InfiniteScrollContainerProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (disabled || error || !hasMore || isLoadingMore) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    let cancelled = false;
    const isRootScrollable =
      root.scrollHeight > root.clientHeight && root.clientHeight > 0;
    const observerRoot = isRootScrollable ? root : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        onLoadMoreRef.current();
      },
      { root: observerRoot, rootMargin },
    );

    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [disabled, error, hasMore, isLoadingMore, loadedCount, rootMargin]);

  return (
    <div ref={rootRef} className={cn('min-h-0', className)} onScroll={onScroll}>
      {children}
      {error && hasMore ? (
        <div className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-spice-text-muted">
          <span>{errorMessage}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="font-semibold text-spice-brand-primary hover:underline"
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {!error && isLoadingMore ? (
        <div className="px-3 py-2 text-center text-sm text-spice-text-muted">
          {loadingMessage}
        </div>
      ) : null}
      {!error && hasMore && !disabled ? (
        <div
          ref={sentinelRef}
          data-testid="infinite-scroll-sentinel"
          aria-hidden
          className="h-1 w-full shrink-0"
        />
      ) : null}
    </div>
  );
};
