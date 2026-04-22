import { useTranslation } from 'react-i18next';

export const ModuleLibraryPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">
        {t('moduleLibrary.title')}
      </h1>
      <p className="text-sm text-slate-600">{t('moduleLibrary.description')}</p>
    </div>
  );
};
