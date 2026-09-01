import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '@/constants/routes';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-spice-brand-primary">
        {t('common.notFound.code')}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-spice-text-primary sm:text-3xl">
        {t('common.notFound.title')}
      </h1>
      <p className="mt-2 max-w-md text-sm text-spice-text-medium">
        {t('common.notFound.description')}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={paths.adminDashboard}
          className="rounded-lg bg-spice-brand-primary px-4 py-2 text-sm font-medium text-white shadow-spicePrimary hover:opacity-95"
        >
          {t('common.notFound.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};
