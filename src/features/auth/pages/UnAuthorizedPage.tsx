import { useTranslation } from 'react-i18next';
import { spiceWebLoginUrl } from '@/config/spiceConfig';

export const UnAuthorizedPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-spice-bg-dashboard px-4 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-spice-border bg-spice-bg-surface p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-spice-brand-primary">
          {t('auth.login.brand')}
        </p>
        <h1 className="mt-3 text-xl font-semibold text-spice-text-primary sm:text-2xl">
          {t('auth.login.title')}
        </h1>
        <p className="mt-2 text-sm text-spice-text-medium">
          {t('auth.login.description')}
        </p>
        <p className="mt-4 text-sm text-spice-text-medium">
          {t('auth.login.instruction')}
        </p>
        <a
          href={spiceWebLoginUrl}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-spice-brand-primary px-3 text-sm font-medium text-white shadow-spicePrimary transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard"
        >
          {t('auth.login.continueToSpice')}
        </a>
      </div>
    </div>
  );
};
