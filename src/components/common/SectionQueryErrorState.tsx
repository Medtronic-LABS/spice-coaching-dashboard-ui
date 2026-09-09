import {
  ApiErrorScreen,
  type ApiErrorScreenProps,
} from '@/components/common/ApiErrorScreen';

export interface SectionQueryErrorStateProps {
  error: unknown;
  /** Optional context-specific heading; catalog title is used when omitted. */
  errorTitle?: string;
  onRetry?: () => void;
  variant?: ApiErrorScreenProps['variant'];
}

export const SectionQueryErrorState = ({
  error,
  errorTitle,
  onRetry,
  variant = 'section',
}: SectionQueryErrorStateProps) => {
  return (
    <ApiErrorScreen
      error={error}
      variant={variant}
      title={errorTitle}
      onRetry={onRetry}
      showGoHome={false}
    />
  );
};
