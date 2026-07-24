import { normalizeRoutePrefix } from '@/config/normalizeRoutePrefix';

function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** App URL prefix from `VITE_ROUTE_PREFIX` (default `/ai-coaching`). */
export const ROUTE_PREFIX = normalizeRoutePrefix(readEnv('VITE_ROUTE_PREFIX'));

function withRoutePrefix(path: string): string {
  if (path === '/') return `${ROUTE_PREFIX}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${ROUTE_PREFIX}${normalized}`;
}

/** Replace `:param` segments in a path template (e.g. `paths.adminModuleReview`). */
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
  moduleLibrary: withRoutePrefix('/module-library'),
  moduleAssigned: withRoutePrefix('/module-library/assigned'),
  ingestDocument: withRoutePrefix('/module-library/ingest'),
  ingestHistory: withRoutePrefix('/module-library/ingest-history'),
  videoUpload: withRoutePrefix('/module-library/ingest-video'),
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
  moduleCreate: withRoutePrefix('/modules/new'),
  moduleLessons: withRoutePrefix('/modules/new/lessons'),
  moduleQuiz: withRoutePrefix('/modules/new/quiz'),
  moduleReview: withRoutePrefix('/modules/new/review'),
  modulePublished: withRoutePrefix('/modules/new/published'),
  configs: withRoutePrefix('/configs'),
} as const;
