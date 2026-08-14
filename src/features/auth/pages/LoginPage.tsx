import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isLoginEnabled } from '@/config/authConfig';
import { paths } from '@/constants/routes';
import { useLoginSubmit } from '@/features/auth/hooks/useLoginSubmit';
import appLogo from '@/features/auth/assets/app-logo-name.png';
import showPassIcon from '@/features/auth/assets/showPass.svg';
import hidePassIcon from '@/features/auth/assets/hidePass.svg';

export const LoginPage = () => {
  const { t } = useTranslation();
  const { submitLogin, isLoading } = useLoginSubmit();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  if (!isLoginEnabled()) {
    return <Navigate to={paths.home} replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const result = await submitLogin(username, password);
    switch (result.status) {
      case 'validation':
        setFieldErrors(result.fieldErrors);
        setErrorMessage(result.message);
        return;
      case 'error':
        setErrorMessage(result.message);
        return;
      case 'unauthorized':
      case 'success':
        return;
      default: {
        const exhaustiveCheck: never = result;
        return exhaustiveCheck;
      }
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8fd] px-4 pb-[2.875rem] text-black">
      <div className="mx-auto w-full max-w-[20rem]">
        <div className="mb-6 mt-8 flex justify-center">
          <img
            src={appLogo}
            alt="Medtronic"
            draggable={false}
            className="h-[75px] w-auto select-none object-contain"
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
                draggable={false}
                className="h-5 w-5 select-none"
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
