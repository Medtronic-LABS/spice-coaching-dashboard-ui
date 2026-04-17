import { Card, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import { useTranslation } from 'react-i18next';

export interface SectionStateCardProps {
  title: string;
  subtitle?: string;
  state: 'loading' | 'error';
  loadingLabel?: string;
  errorDescription?: string;
}

export const SectionStateCard = ({
  title,
  subtitle,
  state,
  loadingLabel,
  errorDescription,
}: SectionStateCardProps) => {
  const { t } = useTranslation();
  const resolvedErrorDescription =
    errorDescription ?? t('common.pleaseTryAgain');

  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />
      {state === 'loading' ? (
        <LoadingState
          label={
            loadingLabel ?? t('ui.sectionState.loadingWithTitle', { title })
          }
        />
      ) : (
        <ErrorState
          title={t('ui.sectionState.unavailableWithTitle', { title })}
          description={resolvedErrorDescription}
        />
      )}
    </Card>
  );
};
