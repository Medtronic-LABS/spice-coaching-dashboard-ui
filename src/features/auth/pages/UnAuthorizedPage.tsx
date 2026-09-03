import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/common/PageTitle';
import { Button } from '@/components/ui/Button';
import { isLoginEnabled } from '@/config/authConfig';
import { spiceWebLoginUrl } from '@/config/spiceConfig';
import { paths } from '@/constants/routes';

export const UnAuthorizedPage = () => {
  const { t } = useTranslation();
  const loginEnabled = isLoginEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center bg-spice-bg-dashboard px-4 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-spice-border bg-spice-bg-surface p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-spice-brand-primary">
          {t('auth.login.brand')}
        </p>
        <PageTitle title={t('auth.login.title')} className="mt-3" />
        <p className="mt-2 text-sm text-spice-text-medium">
          {loginEnabled
            ? t(
                'auth.login.descriptionLogin',
                'Your account signed in successfully, but it does not have coaching suite access for this dashboard.',
              )
            : t('auth.login.description')}
        </p>
        <p className="mt-4 text-sm text-spice-text-medium">
          {loginEnabled
            ? t(
                'auth.login.instructionLogin',
                'Ask an administrator to grant coaching access, or continue in Spice to manage your roles.',
              )
            : t('auth.login.instruction')}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {loginEnabled ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                window.location.assign(paths.login);
              }}
            >
              {t('auth.login.backToLogin', 'Back to login')}
            </Button>
          ) : null}
          <a
            href={spiceWebLoginUrl}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-spice-brand-primary px-3 text-sm font-medium text-white shadow-spicePrimary transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard"
          >
            {t('auth.login.continueToSpice')}
          </a>
        </div>
      </div>
    </div>
  );
};
