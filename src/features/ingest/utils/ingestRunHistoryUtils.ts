import type { IngestionRunSummary } from '@/features/ingest/api/adminIngestionRunsApi';
import {
  isIngestRunning,
  isIngestSucceeded,
  isTerminalIngestStatus,
} from '@/features/ingest/utils/ingestStatus';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

export type IngestRunStatusTone =
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'neutral';

export function formatIngestRunStatusDisplay(
  status: string | undefined,
): string {
  const trimmed = (status ?? '').trim();
  if (!trimmed) return 'Unknown';
  return trimmed
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ingestRunStatusTone(
  status: string | undefined,
): IngestRunStatusTone {
  const normalized = (status ?? '').toLowerCase();
  if (isIngestRunning(normalized)) return 'processing';
  if (normalized === 'partially_succeeded') return 'partial';
  if (isIngestSucceeded(normalized)) return 'completed';
  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'failed';
  }
  if (isTerminalIngestStatus(normalized)) return 'completed';
  return 'neutral';
}

export function ingestRunStatusBadgeClassName(
  tone: IngestRunStatusTone,
): string {
  switch (tone) {
    case 'processing':
      return 'bg-spice-brand-pm/15 text-spice-brand-pm';
    case 'completed':
      return 'bg-spice-semantic-successBg text-spice-semantic-success';
    case 'partial':
      return 'bg-spice-semantic-warningBg text-spice-semantic-warning';
    case 'failed':
      return 'bg-spice-semantic-errorBg text-spice-semantic-error';
    default:
      return 'bg-spice-bg-tint text-spice-text-muted';
  }
}

/** Modules / cards / quizzes labels from the ingestion result reported by the API. */
export function formatIngestRunGeneratedCountParts(run: IngestionRunSummary): {
  modules: string;
  cards: string;
  quizzes: string;
} {
  const moduleLabel = run.generated_module_count === 1 ? 'module' : 'modules';
  return {
    modules: `${run.generated_module_count} ${moduleLabel}`,
    cards: `${run.generated_card_count} cards`,
    quizzes: `${run.generated_quiz_count} quizzes`,
  };
}

export function shouldPollIngestionRunList(
  runs: IngestionRunSummary[],
): boolean {
  return runs.some((run) => isIngestRunning(run.status));
}

export function formatIngestRunTimestamp(
  value: string | null | undefined,
): string {
  return formatDisplayDateTime(value);
}

function parseIngestRunInstant(value: string | null | undefined): Date | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const normalized = trimmed.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.)(\d{3})\d+(.*)$/,
    '$1$2$3',
  );
  if (normalized !== trimmed) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function formatDurationParts(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/** Human-readable duration between started and completed timestamps. */
export function formatIngestRunDurationDisplay(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
): string {
  const started = parseIngestRunInstant(startedAt);
  const completed = parseIngestRunInstant(completedAt);
  if (!started || !completed) {
    return '—';
  }

  return formatDurationParts((completed.getTime() - started.getTime()) / 1000);
}
