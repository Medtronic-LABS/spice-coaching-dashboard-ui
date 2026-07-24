import { ROUTE_PREFIX } from '@/constants/routes';

/** Ensure the app root path with and without a trailing slash resolve the same. */
export function normalizeAppPath(): void {
  const { pathname, search, hash } = window.location;

  if (pathname === ROUTE_PREFIX) {
    window.history.replaceState(
      window.history.state,
      '',
      `${ROUTE_PREFIX}/${search}${hash}`,
    );
  }
}
