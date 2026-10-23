import { normalizeRoutePrefix } from '@/config/normalizeRoutePrefix';

function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** App URL prefix from `VITE_ROUTE_PREFIX` (default `/ai-coaching`). */
export const ROUTE_PREFIX = normalizeRoutePrefix(readEnv('VITE_ROUTE_PREFIX'));

/**
 * Path segments without the app prefix. Change a segment here to rename
 * that area of the SPA without hunting through call sites.
 */
export const routeSegments = {
  moduleLibrary: 'module-library',
  knowledge: 'knowledge',
  ingest: 'ingest',
  badges: 'badge-management',
  dashboard: 'dashboard',
  configs: 'configs',
  modulesNew: 'modules/new',
  unauthorized: 'unauthorized',
} as const;

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

const moduleLibraryRoot = `/${routeSegments.moduleLibrary}`;
const ingestRoot = `/${routeSegments.ingest}`;
const knowledgeRoot = `/${routeSegments.knowledge}`;
const modulesNewRoot = `/${routeSegments.modulesNew}`;

export const paths = {
  home: withRoutePrefix('/'),
  moduleLibrary: withRoutePrefix(moduleLibraryRoot),
  moduleAssigned: withRoutePrefix(`${moduleLibraryRoot}/assigned`),
  badgeManagement: withRoutePrefix(`/${routeSegments.badges}`),
  ingestDocument: withRoutePrefix(ingestRoot),
  ingestHistory: withRoutePrefix(`${ingestRoot}/history`),
  videoUpload: withRoutePrefix(`${ingestRoot}/video`),
  uploadKnowledge: withRoutePrefix(knowledgeRoot),
  adminModuleReview: withRoutePrefix(`${moduleLibraryRoot}/review/:moduleId`),
  adminModuleReviewDetails: withRoutePrefix(
    `${moduleLibraryRoot}/review/:moduleId/details`,
  ),
  adminModuleReviewLessons: withRoutePrefix(
    `${moduleLibraryRoot}/review/:moduleId/lessons`,
  ),
  adminModuleReviewQuiz: withRoutePrefix(
    `${moduleLibraryRoot}/review/:moduleId/quiz`,
  ),
  adminModuleReviewPublish: withRoutePrefix(
    `${moduleLibraryRoot}/review/:moduleId/review`,
  ),
  moduleCreate: withRoutePrefix(modulesNewRoot),
  moduleLessons: withRoutePrefix(`${modulesNewRoot}/lessons`),
  moduleQuiz: withRoutePrefix(`${modulesNewRoot}/quiz`),
  moduleReview: withRoutePrefix(`${modulesNewRoot}/review`),
  modulePublished: withRoutePrefix(`${modulesNewRoot}/published`),
  /** Admin analytics dashboard (default landing route). */
  adminDashboard: withRoutePrefix(`/${routeSegments.dashboard}`),
  configs: withRoutePrefix(`/${routeSegments.configs}`),
  unauthorized: withRoutePrefix(`/${routeSegments.unauthorized}`),
} as const;

/**
 * Former URLs kept only for redirect compatibility. Prefer `paths` for all
 * navigation and route matching.
 */
export const legacyPaths = {
  uploadKnowledge: withRoutePrefix(`${moduleLibraryRoot}/upload-knowledge`),
  ingestDocument: withRoutePrefix(`${moduleLibraryRoot}/ingest`),
  videoUpload: withRoutePrefix(`${moduleLibraryRoot}/ingest-video`),
  ingestHistory: withRoutePrefix(`${moduleLibraryRoot}/ingest-history`),
  adminDashboard: withRoutePrefix('/admin-dashboard'),
} as const;

/** Typed builders for admin module review step URLs. */
export const adminModuleReviewPaths = {
  root: (moduleId: string) => buildPath(paths.adminModuleReview, { moduleId }),
  details: (moduleId: string) =>
    buildPath(paths.adminModuleReviewDetails, { moduleId }),
  lessons: (moduleId: string) =>
    buildPath(paths.adminModuleReviewLessons, { moduleId }),
  quiz: (moduleId: string) =>
    buildPath(paths.adminModuleReviewQuiz, { moduleId }),
  publish: (moduleId: string) =>
    buildPath(paths.adminModuleReviewPublish, { moduleId }),
};
