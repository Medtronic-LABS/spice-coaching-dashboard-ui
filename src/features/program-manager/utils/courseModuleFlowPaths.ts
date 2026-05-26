import { paths } from '@/constants/routes';

const COURSE_FLOW_ROOTS = [
  paths.moduleCreate,
  paths.moduleLessons,
  paths.moduleQuiz,
  paths.moduleReview,
  paths.courseCreate,
  paths.courseLessons,
  paths.courseQuiz,
  paths.courseReview,
] as const;

/** True when pathname stays inside program-manager module creation (any step). */
export function isCourseModuleFlowPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '');
  return COURSE_FLOW_ROOTS.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}
