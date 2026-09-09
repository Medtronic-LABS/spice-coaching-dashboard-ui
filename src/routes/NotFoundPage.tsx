import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppErrorScreen } from '@/components/common/AppErrorScreen';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';

export const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AppErrorScreen
      variant="page"
      title={t('common.notFound.title')}
      description={t('common.notFound.description')}
      statusCode={404}
      errorCode="not_found"
      showGoHome={false}
      primaryAction={
        <Button
          type="button"
          className="h-9 text-xs"
          onClick={() => navigate(paths.adminDashboard)}
        >
          {t('common.notFound.backToDashboard')}
        </Button>
      }
      secondaryAction={
        <Button
          type="button"
          variant="secondary"
          className="h-9 text-xs"
          onClick={() => navigate(paths.home)}
        >
          {t('common.goHome')}
        </Button>
      }
    />
  );
};
