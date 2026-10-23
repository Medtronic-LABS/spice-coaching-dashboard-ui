import type { StatusBadgeProps } from '@/components/ui/StatusBadge';
import {
  formatIngestRunStatusDisplay,
  ingestRunStatusTone,
  type IngestRunStatusTone,
} from '@/features/ingest/utils/ingestRunHistoryUtils';

function ingestRunToneToSemanticStatus(
  tone: IngestRunStatusTone,
): StatusBadgeProps['status'] {
  switch (tone) {
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'partial':
      return 'warning';
    case 'failed':
      return 'critical';
    case 'neutral':
      return 'neutral';
    default: {
      const exhaustiveCheck: never = tone;
      return exhaustiveCheck;
    }
  }
}

export function getIngestRunStatusBadgeProps(
  status: string | undefined,
): Pick<StatusBadgeProps, 'status' | 'label'> {
  return {
    status: ingestRunToneToSemanticStatus(ingestRunStatusTone(status)),
    label: formatIngestRunStatusDisplay(status),
  };
}
