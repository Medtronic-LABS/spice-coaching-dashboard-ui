import { useState } from 'react';
import { DEFAULT_AUTH_USER } from '@/features/auth/constants/defaultAuthUser';
import {
  getAuthSession,
  setAuthSession,
} from '@/features/auth/services/authSession';
import type { SsoRedirectParams } from '@/features/auth/types/auth.types';
import {
  clearSsoParamsFromUrl,
  parseSsoParams,
} from '@/features/auth/utils/ssoParams';

export type AuthBootstrapStatus = 'loading' | 'ready';

function toAuthUser(params: SsoRedirectParams) {
  return {
    tenantId: params.tenantId,
    userId: params.userId,
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
  };
}

function bootstrapAuth(): void {
  const ssoParams = parseSsoParams(window.location.search);
  if (ssoParams) {
    setAuthSession(toAuthUser(ssoParams));
    clearSsoParamsFromUrl();
    return;
  }

  if (!getAuthSession()) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      setAuthSession(DEFAULT_AUTH_USER);
    }
  }
}

export function useAuthBootstrap(): AuthBootstrapStatus {
  const [status] = useState<AuthBootstrapStatus>(() => {
    bootstrapAuth();
    return 'ready';
  });

  return status;
}
