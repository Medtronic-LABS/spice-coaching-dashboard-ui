export const ROUTE_PREFIX = '/medtronics-ui';

function withRoutePrefix(path: string): string {
  if (path === '/') return `${ROUTE_PREFIX}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${ROUTE_PREFIX}${normalized}`;
}

/** Replace `:param` segments in a path template (e.g. `paths.chwProfileDetail`). */
export function buildPath(
  pathTemplate: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    pathTemplate,
  );
}

export const paths = {
  home: withRoutePrefix('/'),
  chwProfiles: withRoutePrefix('/chw-profiles'),
  chwProfileDetail: withRoutePrefix('/chw-profiles/:id'),
  moduleLibrary: withRoutePrefix('/module-library'),
  moduleAssigned: withRoutePrefix('/module-library/assigned'),
  ingestDocument: withRoutePrefix('/module-library/ingest'),
  adminModuleReview: withRoutePrefix('/module-library/review/:moduleId'),
  adminModuleReviewDetails: withRoutePrefix(
    '/module-library/review/:moduleId/details',
  ),
  adminModuleReviewLessons: withRoutePrefix(
    '/module-library/review/:moduleId/lessons',
  ),
  adminModuleReviewQuiz: withRoutePrefix(
    '/module-library/review/:moduleId/quiz',
  ),
  adminModuleReviewPublish: withRoutePrefix(
    '/module-library/review/:moduleId/review',
  ),
  quizPerformance: withRoutePrefix('/quiz-performance'),
  leaderboard: withRoutePrefix('/leaderboard'),
  reports: withRoutePrefix('/reports'),
  supervisors: withRoutePrefix('/supervisors'),
  supervisorDetail: withRoutePrefix('/supervisors/:id'),
  escalations: withRoutePrefix('/escalations'),
  rankings: withRoutePrefix('/rankings'),
  courseCreate: withRoutePrefix('/courses/new'),
  courseLessons: withRoutePrefix('/courses/new/lessons'),
  courseQuiz: withRoutePrefix('/courses/new/quiz'),
  courseReview: withRoutePrefix('/courses/new/review'),
  coursePublished: withRoutePrefix('/courses/new/published'),
  /** Module creation flow (preferred). `course*` routes are kept for backwards compatibility. */
  moduleCreate: withRoutePrefix('/modules/new'),
  moduleLessons: withRoutePrefix('/modules/new/lessons'),
  moduleQuiz: withRoutePrefix('/modules/new/quiz'),
  moduleReview: withRoutePrefix('/modules/new/review'),
  modulePublished: withRoutePrefix('/modules/new/published'),
  uiPreview: withRoutePrefix('/ui-preview'),
  chartPreview: withRoutePrefix('/chart-preview'),
} as const;
