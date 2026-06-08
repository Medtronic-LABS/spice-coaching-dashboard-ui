/** True when pathname stays inside admin module review (any step). */
export function isAdminModuleReviewFlowPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '');
  return /\/module-library\/review\/[^/]+(\/(details|lessons|quiz|review))?$/.test(
    path,
  );
}
