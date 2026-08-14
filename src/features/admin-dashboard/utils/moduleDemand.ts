import type {
  DashboardUserSummary,
  DigitalHelpModuleQuestionItem,
  DigitalHelpModuleRequestItem,
  DigitalHelpModuleUsageItem,
  ModuleCreationSuggestionEvidenceItem,
  ModuleDemandQueryRow,
  ModuleDemandUserEntry,
} from '@/features/admin-dashboard/types/dashboard.types';

export const TOP_MODULE_DEMAND_LIMIT = 10;

export function existingModuleSearchCount(
  module: DigitalHelpModuleUsageItem,
): number {
  return module.digital_help_count + module.module_requested_count;
}

export function sortExistingModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return [...modules].sort(
    (a, b) => existingModuleSearchCount(b) - existingModuleSearchCount(a),
  );
}

export function filterAndRankSearchedModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return sortExistingModules(modules)
    .filter((module) => existingModuleSearchCount(module) > 0)
    .slice(0, TOP_MODULE_DEMAND_LIMIT);
}

function userSummaryToRowFields(user: DashboardUserSummary) {
  return {
    skId: user.user_id,
    skName: user.user_name,
    division: user.division,
    district: user.district,
    upazila: user.upazila,
  };
}

function toUserEntry(
  user: DashboardUserSummary,
  timestamp: string | null,
): ModuleDemandUserEntry {
  return {
    ...userSummaryToRowFields(user),
    timestamp,
  };
}

function groupDemandRows(rows: ModuleDemandQueryRow[]): ModuleDemandQueryRow[] {
  const grouped = new Map<string, ModuleDemandQueryRow>();

  for (const row of rows) {
    const key = `${row.interactionType}|${row.primaryText}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...row,
        users: row.users.length > 0 ? [...row.users] : [rowToUserEntry(row)],
      });
      continue;
    }

    existing.occurrenceCount += row.occurrenceCount;
    existing.users.push(
      ...(row.users.length > 0 ? row.users : [rowToUserEntry(row)]),
    );
    if (
      row.timestamp &&
      (!existing.timestamp || row.timestamp > existing.timestamp)
    ) {
      existing.timestamp = row.timestamp;
    }
  }

  return [...grouped.values()];
}

function rowToUserEntry(row: ModuleDemandQueryRow): ModuleDemandUserEntry {
  return {
    skId: row.skId,
    skName: row.skName,
    division: row.division,
    district: row.district,
    upazila: row.upazila,
    timestamp: row.timestamp,
  };
}

export function mapDigitalHelpQuestionsToRows(
  questions: DigitalHelpModuleQuestionItem[],
): ModuleDemandQueryRow[] {
  return groupDemandRows(
    questions.map((question, index) => ({
      id: `question-${index}-${question.question}`,
      primaryText: question.question,
      occurrenceCount: question.occurrence_count,
      timestamp: question.last_asked_at,
      ...userSummaryToRowFields(question.asked_by),
      interactionType: 'chatbot_served' as const,
      reason: null,
      users: [toUserEntry(question.asked_by, question.last_asked_at)],
    })),
  );
}

export function mapDigitalHelpRequestsToRows(
  requests: DigitalHelpModuleRequestItem[],
  requestFallback: string,
): ModuleDemandQueryRow[] {
  return groupDemandRows(
    requests.map((request, index) => {
      const primaryText = request.reason?.trim() || requestFallback;
      return {
        id: `request-${index}-${request.requested_at}`,
        primaryText,
        occurrenceCount: 1,
        timestamp: request.requested_at,
        ...userSummaryToRowFields(request.requested_by),
        interactionType: 'assignment_requested' as const,
        reason: null,
        users: [toUserEntry(request.requested_by, request.requested_at)],
      };
    }),
  );
}

interface SuggestionReasonInput {
  suggestion_kind: string;
  rationale: string | null;
  proposed_topic: string | null;
  question_count: number;
  request_count: number;
}

export function resolveSuggestionReasonLabel(
  suggestion: SuggestionReasonInput,
  translate: (key: string) => string,
): string {
  if (suggestion.suggestion_kind === 'matched_draft') {
    return translate('adminDashboard.suggestedModules.reasons.draftModule');
  }
  if (suggestion.request_count > 0 && suggestion.question_count === 0) {
    return translate('adminDashboard.suggestedModules.reasons.newTopicRequest');
  }
  if (suggestion.proposed_topic?.trim()) {
    return translate(
      'adminDashboard.suggestedModules.reasons.noMatchingModule',
    );
  }
  const rationale = suggestion.rationale?.trim().toLowerCase() ?? '';
  if (rationale.includes('metadata') || rationale.includes('insufficient')) {
    return translate(
      'adminDashboard.suggestedModules.reasons.insufficientMetadata',
    );
  }
  return (
    suggestion.rationale?.trim() ||
    translate('adminDashboard.suggestedModules.reasons.unattributedDemand')
  );
}

export function mapSuggestionEvidenceToRows(
  items: ModuleCreationSuggestionEvidenceItem[],
  prefix: string,
  reason: string | null,
): ModuleDemandQueryRow[] {
  return groupDemandRows(
    items.map((item, index) => ({
      id: `${prefix}-${index}-${item.text}`,
      primaryText: item.text,
      occurrenceCount: item.occurrence_count,
      timestamp: item.last_seen_at,
      ...userSummaryToRowFields(item.prompted_by),
      interactionType:
        item.source === 'module_requested'
          ? ('assignment_requested' as const)
          : ('chatbot_served' as const),
      reason,
      users: [toUserEntry(item.prompted_by, item.last_seen_at)],
    })),
  );
}

export function sortDemandRowsByTimestamp(
  rows: ModuleDemandQueryRow[],
): ModuleDemandQueryRow[] {
  return [...rows].sort((a, b) => {
    const left = a.timestamp ? Date.parse(a.timestamp) : 0;
    const right = b.timestamp ? Date.parse(b.timestamp) : 0;
    return right - left;
  });
}
