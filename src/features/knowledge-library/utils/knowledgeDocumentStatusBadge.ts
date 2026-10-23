import type { StatusBadgeProps } from '@/components/ui/StatusBadge';
import { formatIngestRunStatusDisplay } from '@/features/ingest/utils/ingestRunHistoryUtils';

export function getKnowledgeDocumentStatusBadgeProps(
  status: string | undefined,
): Pick<StatusBadgeProps, 'status' | 'label'> {
  const normalized = (status ?? '').trim().toLowerCase();
  const label = formatIngestRunStatusDisplay(status);

  if (
    normalized === 'ingested' ||
    normalized === 'completed' ||
    normalized === 'succeeded'
  ) {
    return { status: 'success', label };
  }
  if (normalized === 'partially_succeeded') {
    return { status: 'warning', label };
  }
  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized === 'failed'
  ) {
    return { status: 'critical', label };
  }
  if (normalized === 'retired') {
    return { status: 'warning', label };
  }
  if (
    normalized === 'uploaded' ||
    normalized === 'uploading' ||
    normalized === 'ingesting' ||
    normalized === 'processing' ||
    normalized === 'running'
  ) {
    return { status: 'info', label };
  }
  return { status: 'neutral', label };
}
