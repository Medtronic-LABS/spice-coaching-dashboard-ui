import { paths } from '@/constants/routes';

const MODULE_FLOW_ROOTS = [
  paths.moduleCreate,
  paths.moduleLessons,
  paths.moduleQuiz,
  paths.moduleReview,
] as const;

/** True when pathname stays inside module creation (any step). */
export function isModuleFlowPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '');
  return MODULE_FLOW_ROOTS.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}
