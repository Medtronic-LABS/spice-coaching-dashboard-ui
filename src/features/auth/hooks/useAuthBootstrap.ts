import { useEffect, useState } from 'react';
import { TEST_AUTH_USER } from '@/features/auth/constants/testAuthUser';
import { fetchSpiceUserProfile } from '@/features/auth/services/fetchSpiceUserProfile';
import {
  getAuthSession,
  setAuthSession,
} from '@/features/auth/services/authSession';
import { hasCoachingSuiteAccess } from '@/features/auth/utils/hasCoachingSuiteAccess';
import { mapSpiceProfileToAuthUser } from '@/features/auth/utils/mapSpiceProfileToAuthUser';
import { redirectToSpiceWeb } from '@/features/auth/utils/redirectToSpiceWeb';

export type AuthBootstrapStatus = 'loading' | 'ready' | 'redirecting';

function seedTestAuthSession(): void {
  if (!getAuthSession()) {
    setAuthSession(TEST_AUTH_USER);
  }
}

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

export function useAuthBootstrap(): AuthBootstrapStatus {
  const [status, setStatus] = useState<AuthBootstrapStatus>(() => {
    if (import.meta.env.MODE === 'test' || DEV_AUTH_BYPASS) {
      seedTestAuthSession();
      return 'ready';
    }
    return 'loading';
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || DEV_AUTH_BYPASS) return;

    let cancelled = false;

    async function bootstrapFromSpiceProfile(): Promise<void> {
      try {
        const profile = await fetchSpiceUserProfile();
        if (cancelled) return;

        if (!hasCoachingSuiteAccess(profile.entity.suiteAccess)) {
          setStatus('redirecting');
          redirectToSpiceWeb();
          return;
        }

        setAuthSession(mapSpiceProfileToAuthUser(profile.entity));
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('redirecting');
        redirectToSpiceWeb();
      }
    }

    void bootstrapFromSpiceProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
