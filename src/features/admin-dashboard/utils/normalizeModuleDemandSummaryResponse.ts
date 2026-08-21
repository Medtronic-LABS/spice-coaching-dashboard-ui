import type {
  ModuleDemandPatternItem,
  ModuleDemandSummaryBucket,
  ModuleDemandSummaryResponse,
} from '@/features/admin-dashboard/types/dashboard.types';
import { formatDisplayDate } from '@/utils/formatDisplayDateTime';

const EMPTY_SUMMARY: ModuleDemandSummaryResponse = {
  from_date: '',
  to_date: '',
  title: '',
  date_label: '',
  narrative: '',
  empty_message: null,
  demand_pattern: [],
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = readString(value);
  return trimmed || null;
}

export function resolveModuleDemandSummaryBucket(
  value: unknown,
): ModuleDemandSummaryBucket {
  const normalized = readString(value).toLowerCase();
  switch (normalized) {
    case 'assign':
      return 'assign';
    case 'publish':
      return 'publish';
    case 'create':
      return 'create';
    default:
      return 'other';
  }
}

function parseDemandPatternItem(
  value: unknown,
): ModuleDemandPatternItem | null {
  if (!isPlainObject(value)) return null;

  const title = readString(value.title);
  const description = readString(value.description);
  if (!title && !description) return null;

  return {
    bucket: resolveModuleDemandSummaryBucket(value.bucket),
    title,
    description,
  };
}

export function formatModuleDemandSummaryDateLabel(
  fromDate: string,
  toDate: string,
): string {
  const from = formatDisplayDate(fromDate);
  const to = formatDisplayDate(toDate);
  if (from === '—' || to === '—') {
    return fromDate && toDate ? `${fromDate}–${toDate}` : '';
  }
  return `${from}–${to}`;
}

/** Normalize module-demand summary API payloads into typed dashboard data. */
export function normalizeModuleDemandSummaryResponse(
  response: unknown,
): ModuleDemandSummaryResponse {
  if (!isPlainObject(response)) {
    return EMPTY_SUMMARY;
  }

  const from_date = readString(response.from_date);
  const to_date = readString(response.to_date);
  const demand_pattern = Array.isArray(response.demand_pattern)
    ? response.demand_pattern
        .map((item) => parseDemandPatternItem(item))
        .filter((item): item is ModuleDemandPatternItem => item !== null)
    : [];

  const date_label =
    readString(response.date_label) ||
    formatModuleDemandSummaryDateLabel(from_date, to_date);

  const title = readString(response.title);
  const narrative = readString(response.narrative);
  const legacySummary = readString(response.summary);

  if (!narrative && demand_pattern.length === 0 && legacySummary) {
    return {
      from_date,
      to_date,
      title,
      date_label,
      narrative: legacySummary,
      empty_message: readNullableString(response.empty_message),
      demand_pattern,
    };
  }

  return {
    from_date,
    to_date,
    title,
    date_label,
    narrative,
    empty_message: readNullableString(response.empty_message),
    demand_pattern,
  };
}

export function hasModuleDemandSummaryContent(
  summary: ModuleDemandSummaryResponse,
): boolean {
  return (
    summary.narrative.length > 0 ||
    summary.demand_pattern.length > 0 ||
    summary.title.length > 0
  );
}
