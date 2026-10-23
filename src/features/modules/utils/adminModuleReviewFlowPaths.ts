import { matchPath } from 'react-router-dom';
import { paths } from '@/constants/routes';

/** True when pathname stays inside admin module review (any step). */
export function isAdminModuleReviewFlowPath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return Boolean(
    matchPath({ path: paths.adminModuleReview, end: false }, path),
  );
}
