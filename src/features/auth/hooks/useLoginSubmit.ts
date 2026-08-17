import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { useLoginMutation } from '@/features/auth/api/authApi';
import { setAuthSession } from '@/features/auth/services/authSession';
import { hasCoachingSuiteAccess } from '@/features/auth/utils/hasCoachingSuiteAccess';
import { mapLoginResponseToAuthUser } from '@/features/auth/utils/mapLoginResponseToAuthUser';
import { hashPasswordWithHmac } from '@/features/auth/utils/passwordHash';

export type LoginFieldErrors = {
  username?: string;
  password?: string;
};

export type LoginSubmitResult =
  | { status: 'validation'; fieldErrors: LoginFieldErrors; message: string }
  | { status: 'error'; message: string }
  | { status: 'unauthorized' }
  | { status: 'success' };

function extractAuthCookie(response: {
  authorization?: string | null;
  token?: string | null;
  cookie?: string | null;
  authHeader?: unknown;
}): string | undefined {
  if (typeof response.authorization === 'string') return response.authorization;
  if (typeof response.token === 'string') return response.token;
  if (typeof response.cookie === 'string') return response.cookie;
  if (typeof response.authHeader === 'string') return response.authHeader;
  return undefined;
}

function extractLoginErrorMessage(err: unknown, fallback: string): string {
  const record =
    err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
  const data =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : {};
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}

/** Owns login hashing, session mapping, suite-access gate, and navigation. */
export function useLoginSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loginApi, { isLoading }] = useLoginMutation();

  const submitLogin = async (
    username: string,
    password: string,
  ): Promise<LoginSubmitResult> => {
    const trimmedUsername = username.trim();
    const fieldErrors: LoginFieldErrors = {};
    if (!trimmedUsername) {
      fieldErrors.username = t(
        'auth.signIn.errorEmailRequired',
        'Please enter email',
      );
    }
    if (!password) {
      fieldErrors.password = t(
        'auth.signIn.errorPasswordRequired',
        'Please enter password',
      );
    }
    if (fieldErrors.username || fieldErrors.password) {
      return {
        status: 'validation',
        fieldErrors,
        message: t(
          'auth.signIn.errorRequiredFields',
          'Please enter both username and password.',
        ),
      };
    }

    try {
      const hashedPassword = hashPasswordWithHmac(password);
      const response = await loginApi({
        username: trimmedUsername,
        password: hashedPassword,
      }).unwrap();

      const authCookie = extractAuthCookie(response);
      if (!authCookie) {
        return {
          status: 'error',
          message: t(
            'auth.signIn.errorMissingAuthCookie',
            'Sign-in succeeded but no auth cookie was returned. Please try again.',
          ),
        };
      }

      const authUser = mapLoginResponseToAuthUser(response, {
        authCookie,
        usernameFallback: trimmedUsername,
      });
      if (!authUser) {
        return {
          status: 'error',
          message: t(
            'auth.signIn.errorMissingIdentity',
            'Sign-in succeeded but user identity was incomplete. Please try again.',
          ),
        };
      }

      if (!hasCoachingSuiteAccess(response.suiteAccess)) {
        navigate(paths.unauthorized, { replace: true });
        return { status: 'unauthorized' };
      }

      setAuthSession(authUser);
      navigate(paths.home, { replace: true });
      return { status: 'success' };
    } catch (err: unknown) {
      return {
        status: 'error',
        message: extractLoginErrorMessage(
          err,
          t(
            'auth.signIn.errorMessage',
            'Invalid credentials or login failed. Please try again.',
          ),
        ),
      };
    }
  };

  return { submitLogin, isLoading };
}
