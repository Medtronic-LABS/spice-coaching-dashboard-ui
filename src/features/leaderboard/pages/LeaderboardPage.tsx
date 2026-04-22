import { useTranslation } from 'react-i18next';

export const LeaderboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">
        {t('leaderboard.title')}
      </h1>
      <p className="text-sm text-slate-600">{t('leaderboard.description')}</p>
    </div>
  );
};
