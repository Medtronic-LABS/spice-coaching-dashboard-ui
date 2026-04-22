import { useTranslation } from 'react-i18next';

export const CHWView = () => {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold text-slate-900">
        {t('chw.title')}
      </h2>
    </section>
  );
};
