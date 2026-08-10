import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isLoginEnabled } from '@/config/authConfig';
import { paths } from '@/constants/routes';
import { useLoginMutation } from '@/features/auth/api/authApi';
import { setAuthSession } from '@/features/auth/services/authSession';
import { hasCoachingSuiteAccess } from '@/features/auth/utils/hasCoachingSuiteAccess';
import { hashPasswordWithHmac } from '@/features/auth/utils/passwordHash';
import { mapLoginResponseToAuthUser } from '@/features/auth/utils/mapLoginResponseToAuthUser';
import appLogo from '@/features/auth/assets/app-logo-name.png';
import showPassIcon from '@/features/auth/assets/showPass.svg';
import hidePassIcon from '@/features/auth/assets/hidePass.svg';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const [loginApi, { isLoading }] = useLoginMutation();

  if (!isLoginEnabled()) {
    return <Navigate to={paths.home} replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    const nextErrors: { username?: string; password?: string } = {};
    if (!trimmedUsername) {
      nextErrors.username = t(
        'auth.signIn.errorEmailRequired',
        'Please enter email',
      );
    }
    if (!password) {
      nextErrors.password = t(
        'auth.signIn.errorPasswordRequired',
        'Please enter password',
      );
    }
    setFieldErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) {
      setErrorMessage(
        t(
          'auth.signIn.errorRequiredFields',
          'Please enter both username and password.',
        ),
      );
      return;
    }

    try {
      // Same HMAC-SHA512 hex hashing as spice-2.0-admin-web login saga
      const hashedPassword = hashPasswordWithHmac(password);

      const response = await loginApi({
        username: trimmedUsername,
        password: hashedPassword,
      }).unwrap();

      // Body often has authorization/cookie null; coaching-platform puts it on headers.
      const authCookie =
        (typeof response.authorization === 'string'
          ? response.authorization
          : undefined) ??
        (typeof response.token === 'string' ? response.token : undefined) ??
        (typeof response.cookie === 'string' ? response.cookie : undefined) ??
        (typeof response.authHeader === 'string'
          ? response.authHeader
          : undefined);

      if (!authCookie) {
        setErrorMessage(
          t(
            'auth.signIn.errorMissingAuthCookie',
            'Sign-in succeeded but no auth cookie was returned. Please try again.',
          ),
        );
        return;
      }

      const authUser = mapLoginResponseToAuthUser(response, {
        authCookie,
        usernameFallback: trimmedUsername,
      });

      if (!authUser) {
        setErrorMessage(
          t(
            'auth.signIn.errorMissingIdentity',
            'Sign-in succeeded but user identity was incomplete. Please try again.',
          ),
        );
        return;
      }

      if (!hasCoachingSuiteAccess(response.suiteAccess)) {
        navigate(paths.unauthorized, { replace: true });
        return;
      }

      setAuthSession(authUser);
      navigate(paths.home, { replace: true });
    } catch (err: unknown) {
      const record =
        err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
      const data =
        record.data && typeof record.data === 'object'
          ? (record.data as Record<string, unknown>)
          : {};
      const detail =
        typeof data.detail === 'string'
          ? data.detail
          : typeof data.message === 'string'
            ? data.message
            : null;

      setErrorMessage(
        detail ||
          t(
            'auth.signIn.errorMessage',
            'Invalid credentials or login failed. Please try again.',
          ),
      );
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8fd] px-4 pb-[2.875rem] text-black">
      <div className="mx-auto w-full max-w-[20rem]">
        <div className="mb-6 mt-8 flex justify-center">
          <img
            src={appLogo}
            alt="Medtronic"
            className="h-[75px] w-auto object-contain"
          />
        </div>

        <div className="text-center font-bold">
          {t('auth.signIn.welcome', 'Welcome')}
        </div>
        <div className="mb-8 text-center text-2xl font-bold leading-8">
          {t('auth.signIn.title', 'Login to your account')}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="relative mb-2 text-sm">
            <label
              htmlFor="username"
              className="mb-2 block pl-px leading-5 text-[#595959]"
            >
              {t(
                'auth.signIn.usernameLabel',
                'Email, username or mobile number',
              )}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }}
              className="h-10 w-full rounded-[0.187rem] border-[0.5px] border-black/40 px-3 py-2.5 text-black outline-none hover:border-[#595959] focus:border-[#595959] focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]"
            />
            <div className="min-h-6 pt-px text-[0.85rem] text-red-600">
              {fieldErrors.username}
            </div>
          </div>

          <div className="relative mb-2 text-sm">
            <label
              htmlFor="password"
              className="mb-2 block pl-px leading-5 text-[#595959]"
            >
              {t('auth.signIn.passwordLabel', 'Password')}
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className="h-10 w-full rounded-[0.187rem] border-[0.5px] border-black/40 py-2.5 pl-3 pr-20 text-black outline-none hover:border-[#595959] focus:border-[#595959] focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-10 cursor-pointer border-0 bg-transparent p-0"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <img
                src={showPassword ? hidePassIcon : showPassIcon}
                alt={showPassword ? 'Hide password' : 'Show password'}
                className="h-5 w-5"
              />
            </button>
            <div className="min-h-6 pt-px text-[0.85rem] text-red-600">
              {fieldErrors.password}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-10 w-full rounded border border-[#2514be] bg-[#2514be] text-sm font-medium text-white hover:border-[#1e1098] hover:bg-[#1e1098] active:border-[#160c72] active:bg-[#160c72] disabled:cursor-not-allowed disabled:border-black/40 disabled:bg-black/40"
          >
            {isLoading
              ? t('auth.signIn.submitting', 'Logging in...')
              : t('auth.signIn.submitButton', 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
};
