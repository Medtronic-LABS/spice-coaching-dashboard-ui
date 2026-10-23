import { Tooltip } from '@/components/ui/Tooltip';
import { extractIngestFailureTooltipMessage } from '@/features/ingest/utils/extractIngestErrorMessage';
import {
  formatIngestRunStatusDisplay,
  ingestRunStatusTone,
} from '@/features/ingest/utils/ingestRunHistoryUtils';

interface IngestFlowStatusLabelProps {
  status: string;
  /** Node/source/batch row or nested error payload. */
  failureContext?: unknown;
  className?: string;
}

export const IngestFlowStatusLabel = ({
  status,
  failureContext,
  className = 'text-xs',
}: IngestFlowStatusLabelProps) => {
  const hasStatus = Boolean(status.trim());
  const failed = hasStatus && ingestRunStatusTone(status) === 'failed';
  const tooltipMessage = extractIngestFailureTooltipMessage(failureContext);
  const statusLabel = formatIngestRunStatusDisplay(status);

  if (failed && tooltipMessage) {
    return (
      <div className={`flex items-center ${className}`.trim()}>
        <Tooltip label={tooltipMessage} content={tooltipMessage} />
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
