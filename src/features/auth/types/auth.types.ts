export interface AuthUser {
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token?: string;
  authorization?: string;
}

export interface SsoRedirectParams {
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string; // hashed password
}

export interface LoginRole {
  id?: number;
  name?: string;
  level?: number | null;
  suiteAccessName?: string;
  authority?: string;
  appTypes?: string[];
  reportPrivileges?: unknown[];
}

export interface LoginResponse {
  tenantId?: string | number;
  userId?: string | number;
  id?: string | number;
  email?: string | null;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: LoginRole[];
  isSuperUser?: boolean;
  suiteAccess?: string[];
  token?: string | null;
  authorization?: string | null;
  cookie?: string | null;
  message?: string;
  user?: Partial<AuthUser>;
  [key: string]: unknown;
}
