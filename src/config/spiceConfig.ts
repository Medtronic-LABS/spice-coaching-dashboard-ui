function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const DEFAULT_SPICE_WEB_LOGIN_URL = 'http://localhost:3000/';
const DEFAULT_SPICE_ADMIN_API_URL = '/admin-service';
const DEFAULT_SPICE_USER_API_URL = '/user-service';

/** Spice web app used when cookie auth fails or coaching suite access is denied. */
export const spiceWebLoginUrl = normalizeUrl(
  readEnv('VITE_SPICE_WEB_LOGIN_URL') ?? DEFAULT_SPICE_WEB_LOGIN_URL,
);

/** Admin-service origin (no trailing slash) for hierarchical region APIs. */
export const spiceAdminApiUrl = normalizeBaseUrl(
  readEnv('VITE_SPICE_ADMIN_API_URL') ?? DEFAULT_SPICE_ADMIN_API_URL,
);

/** User-service origin (no trailing slash) for CHW listing APIs. */
export const spiceUserApiUrl = normalizeBaseUrl(
  readEnv('VITE_SPICE_USER_API_URL') ?? DEFAULT_SPICE_USER_API_URL,
);

const SPICE_ADMIN_REGION_PATHS = [
  'country/list',
  'district-list',
  'chiefdom-list',
  'villages-list',
  'region-details',
  'healthfacility/chiefdom-list/',
] as const;

const SPICE_USER_ASSIGNMENT_PATHS = [
  'user/admin-users',
  'user/role-user-list',
] as const;

function normalizeRequestUrl(url: string): string {
  return url.startsWith('/') ? url.slice(1) : url;
}

/** True when the request targets admin-service region/facility endpoints. */
export function isSpiceAdminServiceRequest(url: string): boolean {
  const normalized = normalizeRequestUrl(url);
  const adminPrefix = normalizeRequestUrl(spiceAdminApiUrl);
  if (normalized.startsWith(adminPrefix)) return true;
  return SPICE_ADMIN_REGION_PATHS.some((path) => normalized.includes(path));
}

/** True when the request targets user-service CHW listing endpoints. */
export function isSpiceUserServiceRequest(url: string): boolean {
  const normalized = normalizeRequestUrl(url);
  const userPrefix = normalizeRequestUrl(spiceUserApiUrl);
  if (normalized.startsWith(userPrefix)) return true;
  return SPICE_USER_ASSIGNMENT_PATHS.some((path) => normalized.endsWith(path));
}
