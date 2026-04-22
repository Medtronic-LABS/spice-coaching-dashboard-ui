import { useTranslation } from 'react-i18next';

export const ReportsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">
        {t('reports.title')}
      </h1>
      <p className="text-sm text-slate-600">{t('reports.description')}</p>
    </div>
  );
};
