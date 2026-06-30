export interface AuthUser {
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface SsoRedirectParams {
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
