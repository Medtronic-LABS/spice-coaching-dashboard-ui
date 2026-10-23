import { useEffect, useRef, useState } from 'react';

/**
 * True after `filterKey` changes until the refetch for those args settles.
 *
 * Cached `currentData` must not skip the skeleton. Same-args refetches
 * (window focus, retry) do not flip this flag.
 */
export function useDashboardArgChangeLoading(
  filterKey: string,
  isFetching: boolean,
): boolean {
  const [trackedKey, setTrackedKey] = useState(filterKey);
  const [pending, setPending] = useState(false);
  const sawFetch = useRef(false);

  if (trackedKey !== filterKey) {
    setTrackedKey(filterKey);
    setPending(true);
    sawFetch.current = isFetching;
  }

  useEffect(() => {
    if (!pending) return undefined;
    if (isFetching) {
      sawFetch.current = true;
      return undefined;
    }
    if (sawFetch.current) {
      setPending(false);
      return undefined;
    }
    // Refetch has not started yet. Yield once so a cache-only result can settle
    // without leaving the skeleton up forever.
    const timer = window.setTimeout(() => {
      if (!sawFetch.current) setPending(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pending, isFetching]);

  return trackedKey !== filterKey || pending;
}
