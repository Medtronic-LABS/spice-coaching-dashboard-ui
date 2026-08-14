import { useEffect, useState } from 'react';
import { TEST_AUTH_USER } from '@/features/auth/constants/testAuthUser';
import {
  getAuthSession,
  setAuthSession,
} from '@/features/auth/services/authSession';
import {
  fetchSpiceUserProfile,
  isSpiceProfileUnauthorizedError,
} from '@/features/auth/services/fetchSpiceUserProfile';
import { hasCoachingSuiteAccess } from '@/features/auth/utils/hasCoachingSuiteAccess';
import { mapSpiceProfileToAuthUser } from '@/features/auth/utils/mapSpiceProfileToAuthUser';
import { redirectToSpiceWeb } from '@/features/auth/utils/redirectToSpiceWeb';

export type AuthBootstrapStatus = 'loading' | 'ready' | 'redirecting';

function seedTestAuthSession(): void {
  if (!getAuthSession()) {
    setAuthSession(TEST_AUTH_USER);
  }
}

export function useAuthBootstrap(): AuthBootstrapStatus {
  const [status, setStatus] = useState<AuthBootstrapStatus>(() => {
    if (import.meta.env.MODE === 'test') {
      seedTestAuthSession();
      return 'ready';
    }
    return 'loading';
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;

    let cancelled = false;

    async function bootstrapFromSpiceProfile(): Promise<void> {
      try {
        const profile = await fetchSpiceUserProfile();
        if (cancelled) return;

        if (!hasCoachingSuiteAccess(profile.entity.suiteAccess)) {
          setStatus('ready');
          return;
        }

        setAuthSession(mapSpiceProfileToAuthUser(profile.entity));
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        if (isSpiceProfileUnauthorizedError(error)) {
          setStatus('redirecting');
          redirectToSpiceWeb();
          return;
        }
        setStatus('ready');
      }
    }

    void bootstrapFromSpiceProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
