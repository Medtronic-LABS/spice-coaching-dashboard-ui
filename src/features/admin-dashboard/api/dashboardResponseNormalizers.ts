import { parseLocalizedStringField } from '@/features/modules/utils/localizedWire';
import type {
  DashboardUserSummary,
  DigitalHelpModuleQuestionItem,
  DigitalHelpModuleQuestionsResponse,
  DigitalHelpModuleRequestItem,
  DigitalHelpModuleRequestsResponse,
  DigitalHelpModuleUsageItem,
  DigitalHelpModuleUsageResponse,
  ModuleCreationSuggestionDetailResponse,
  ModuleCreationSuggestionEvidenceItem,
  ModuleCreationSuggestionListItem,
  ModuleCreationSuggestionListResponse,
} from '@/features/admin-dashboard/types/dashboard.types';
import type { LocalizedString } from '@/types/localized';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseTitle(raw: unknown): LocalizedString | null {
  if (raw === null || raw === undefined) return null;
  if (!isPlainObject(raw) && typeof raw !== 'string') return null;
  return parseLocalizedStringField({ title: raw }, 'title');
}

const EMPTY_USER_SUMMARY: DashboardUserSummary = {
  user_id: null,
  user_name: null,
  user_role: null,
  division: null,
  district: null,
  upazila: null,
};

export function normalizeDashboardUserSummary(
  raw: unknown,
): DashboardUserSummary {
  if (!isPlainObject(raw)) return EMPTY_USER_SUMMARY;
  return {
    user_id: asNullableNumber(raw.user_id),
    user_name: asNullableString(raw.user_name),
    user_role: asNullableString(raw.user_role),
    division: asNullableString(raw.division),
    district: asNullableString(raw.district),
    upazila: asNullableString(raw.upazila),
  };
}

export function normalizeDigitalHelpModuleUsageItem(
  raw: unknown,
): DigitalHelpModuleUsageItem | null {
  if (!isPlainObject(raw)) return null;
  const module_id = asString(raw.module_id);
  if (!module_id) return null;
  return {
    module_id,
    module_family_id: asNullableString(raw.module_family_id),
    digital_help_count: asNumber(raw.digital_help_count),
    module_requested_count: asNumber(raw.module_requested_count),
    title: parseTitle(raw.title),
  };
}

export function normalizeDigitalHelpModuleUsageResponse(
  raw: unknown,
): DigitalHelpModuleUsageResponse {
  if (!isPlainObject(raw)) {
    return {
      from_date: '',
      to_date: '',
      total_digital_help: 0,
      total_module_requested: 0,
      total_modules: 0,
      limit: 0,
      offset: 0,
      modules: [],
    };
  }
  const modules = Array.isArray(raw.modules)
    ? raw.modules
        .map(normalizeDigitalHelpModuleUsageItem)
        .filter((item): item is DigitalHelpModuleUsageItem => item !== null)
    : [];
  return {
    from_date: asString(raw.from_date) ?? '',
    to_date: asString(raw.to_date) ?? '',
    total_digital_help: asNumber(raw.total_digital_help),
    total_module_requested: asNumber(raw.total_module_requested),
    total_modules: asNumber(raw.total_modules, modules.length),
    limit: asNumber(raw.limit),
    offset: asNumber(raw.offset),
    modules,
  };
}

function normalizeDigitalHelpModuleQuestionItem(
  raw: unknown,
): DigitalHelpModuleQuestionItem | null {
  if (!isPlainObject(raw)) return null;
  const question = asString(raw.question)?.trim() ?? '';
  const last_asked_at = asString(raw.last_asked_at);
  if (!question || !last_asked_at) return null;
  return {
    question,
    occurrence_count: asNumber(raw.occurrence_count, 1),
    last_asked_at,
    asked_by: normalizeDashboardUserSummary(raw.asked_by),
  };
}

export function normalizeDigitalHelpModuleQuestionsResponse(
  raw: unknown,
): DigitalHelpModuleQuestionsResponse {
  if (!isPlainObject(raw)) {
    return {
      module_id: '',
      title: null,
      from_date: '',
      to_date: '',
      questions: [],
      total_questions: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    };
  }
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map(normalizeDigitalHelpModuleQuestionItem)
        .filter((item): item is DigitalHelpModuleQuestionItem => item !== null)
    : [];
  return {
    module_id: asString(raw.module_id) ?? '',
    title: parseTitle(raw.title),
    from_date: asString(raw.from_date) ?? '',
    to_date: asString(raw.to_date) ?? '',
    questions,
    total_questions: asNumber(raw.total_questions, questions.length),
    total_pages: asNumber(raw.total_pages),
    limit: asNumber(raw.limit),
    offset: asNumber(raw.offset),
  };
}

function normalizeDigitalHelpModuleRequestItem(
  raw: unknown,
): DigitalHelpModuleRequestItem | null {
  if (!isPlainObject(raw)) return null;
  const requested_at = asString(raw.requested_at);
  if (!requested_at) return null;
  return {
    requested_at,
    reason: asNullableString(raw.reason),
    requested_by: normalizeDashboardUserSummary(raw.requested_by),
  };
}

export function normalizeDigitalHelpModuleRequestsResponse(
  raw: unknown,
): DigitalHelpModuleRequestsResponse {
  if (!isPlainObject(raw)) {
    return {
      module_id: '',
      title: null,
      from_date: '',
      to_date: '',
      requests: [],
      total_requests: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    };
  }
  const requests = Array.isArray(raw.requests)
    ? raw.requests
        .map(normalizeDigitalHelpModuleRequestItem)
        .filter((item): item is DigitalHelpModuleRequestItem => item !== null)
    : [];
  return {
    module_id: asString(raw.module_id) ?? '',
    title: parseTitle(raw.title),
    from_date: asString(raw.from_date) ?? '',
    to_date: asString(raw.to_date) ?? '',
    requests,
    total_requests: asNumber(raw.total_requests, requests.length),
    total_pages: asNumber(raw.total_pages),
    limit: asNumber(raw.limit),
    offset: asNumber(raw.offset),
  };
}

function normalizeSuggestionListItem(
  raw: unknown,
): ModuleCreationSuggestionListItem | null {
  if (!isPlainObject(raw)) return null;
  const id = asString(raw.id);
  const suggestion_date = asString(raw.suggestion_date);
  const suggestion_kind = asString(raw.suggestion_kind);
  const display_title = asString(raw.display_title);
  const computed_at = asString(raw.computed_at);
  if (
    !id ||
    !suggestion_date ||
    !suggestion_kind ||
    !display_title ||
    !computed_at
  ) {
    return null;
  }
  return {
    id,
    suggestion_date,
    suggestion_kind,
    matched_module_id: asNullableString(raw.matched_module_id),
    proposed_topic: asNullableString(raw.proposed_topic),
    display_title,
    rationale: asNullableString(raw.rationale),
    question_count: asNumber(raw.question_count),
    request_count: asNumber(raw.request_count),
    evidence_count: asNumber(raw.evidence_count),
    rank: asNumber(raw.rank),
    computed_at,
  };
}

export function normalizeSuggestionListResponse(
  raw: unknown,
): ModuleCreationSuggestionListResponse {
  if (!isPlainObject(raw)) {
    return {
      from_date: '',
      to_date: '',
      suggestions: [],
      total_suggestions: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    };
  }
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions
        .map(normalizeSuggestionListItem)
        .filter(
          (item): item is ModuleCreationSuggestionListItem => item !== null,
        )
    : [];
  return {
    from_date: asString(raw.from_date) ?? '',
    to_date: asString(raw.to_date) ?? '',
    suggestions,
    total_suggestions: asNumber(raw.total_suggestions, suggestions.length),
    total_pages: asNumber(raw.total_pages),
    limit: asNumber(raw.limit),
    offset: asNumber(raw.offset),
  };
}

function normalizeEvidenceItem(
  raw: unknown,
): ModuleCreationSuggestionEvidenceItem | null {
  if (!isPlainObject(raw)) return null;
  const source = asString(raw.source);
  const text = asString(raw.text)?.trim() ?? '';
  if (!source || !text) return null;
  return {
    source,
    text,
    occurrence_count: asNumber(raw.occurrence_count, 1),
    last_seen_at: asNullableString(raw.last_seen_at),
    prompted_by: normalizeDashboardUserSummary(raw.prompted_by),
  };
}

export function normalizeSuggestionDetailResponse(
  raw: unknown,
): ModuleCreationSuggestionDetailResponse | null {
  if (!isPlainObject(raw)) return null;
  const suggestion = normalizeSuggestionListItem(raw.suggestion);
  if (!suggestion) return null;
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map(normalizeEvidenceItem)
        .filter(
          (item): item is ModuleCreationSuggestionEvidenceItem => item !== null,
        )
    : [];
  const requests = Array.isArray(raw.requests)
    ? raw.requests
        .map(normalizeEvidenceItem)
        .filter(
          (item): item is ModuleCreationSuggestionEvidenceItem => item !== null,
        )
    : [];
  return { suggestion, questions, requests };
}
