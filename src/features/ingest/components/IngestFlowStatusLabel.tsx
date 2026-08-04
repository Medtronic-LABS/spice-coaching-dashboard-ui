import { Tooltip } from '@/components/ui/Tooltip';
import { extractIngestErrorMessage } from '@/features/ingest/utils/extractIngestErrorMessage';
import {
  formatIngestRunStatusDisplay,
  ingestRunStatusTone,
} from '@/features/ingest/utils/ingestRunHistoryUtils';

interface IngestFlowStatusLabelProps {
  status: string;
  error?: unknown;
  className?: string;
}

export const IngestFlowStatusLabel = ({
  status,
  error,
  className = 'text-xs',
}: IngestFlowStatusLabelProps) => {
  const hasStatus = Boolean(status.trim());
  const failed = hasStatus && ingestRunStatusTone(status) === 'failed';
  const errorMessage = extractIngestErrorMessage(error);
  const statusLabel = formatIngestRunStatusDisplay(status);

  if (failed && errorMessage) {
    return (
      <div className={`flex items-center ${className}`.trim()}>
        <Tooltip label={errorMessage} content={errorMessage} />
      </div>
    );
  }

  if (!hasStatus) {
    return null;
  }

  return (
    <span
      className={`${className} ${
        failed
          ? 'font-semibold text-spice-semantic-error'
          : 'text-spice-text-muted'
      }`.trim()}
    >
      {statusLabel}
    </span>
  );
};
