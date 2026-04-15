import { Card, ErrorState, LoadingState, SectionHeader } from '@/components/ui';

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
  errorDescription = 'Please try again.',
}: SectionStateCardProps) => {
  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />
      {state === 'loading' ? (
        <LoadingState
          label={loadingLabel ?? `Loading ${title.toLowerCase()}`}
        />
      ) : (
        <ErrorState
          title={`${title} unavailable`}
          description={errorDescription}
        />
      )}
    </Card>
  );
};
