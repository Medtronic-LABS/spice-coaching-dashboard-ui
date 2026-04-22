import { useTranslation } from 'react-i18next';

export const QuizPerformancePage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-slate-900">
        {t('quizPerformance.title')}
      </h1>
      <p className="text-sm text-slate-600">
        {t('quizPerformance.description')}
      </p>
    </div>
  );
};
