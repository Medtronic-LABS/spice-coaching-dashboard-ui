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

export interface LoginResponse {
  tenantId?: string | number;
  userId?: string | number;
  id?: string | number;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  token?: string;
  authorization?: string;
  message?: string;
  user?: Partial<AuthUser>;
  [key: string]: unknown;
}
