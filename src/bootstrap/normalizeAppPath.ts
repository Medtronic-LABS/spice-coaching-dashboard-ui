import { ROUTE_PREFIX } from '@/constants/routes';

/** Ensure `/medtronics-ui` and `/medtronics-ui/` resolve to the same app entry. */
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
