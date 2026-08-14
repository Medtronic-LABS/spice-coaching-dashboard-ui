import type {
  DashboardUserSummary,
  DigitalHelpModuleQuestionItem,
  DigitalHelpModuleRequestItem,
  DigitalHelpModuleUsageItem,
  ModuleCreationSuggestionEvidenceItem,
  ModuleDemandQueryRow,
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
    district: user.district,
    upazila: user.upazila,
  };
}

export function mapDigitalHelpQuestionsToRows(
  questions: DigitalHelpModuleQuestionItem[],
): ModuleDemandQueryRow[] {
  return questions.map((question, index) => ({
    id: `question-${index}-${question.question}`,
    primaryText: question.question,
    occurrenceCount: question.occurrence_count,
    timestamp: question.last_asked_at,
    ...userSummaryToRowFields(question.asked_by),
    interactionType: 'chatbot_served',
    reason: null,
  }));
}

export function mapDigitalHelpRequestsToRows(
  requests: DigitalHelpModuleRequestItem[],
  requestFallback: string,
): ModuleDemandQueryRow[] {
  return requests.map((request, index) => ({
    id: `request-${index}-${request.requested_at}`,
    primaryText: request.reason?.trim() || requestFallback,
    occurrenceCount: 1,
    timestamp: request.requested_at,
    ...userSummaryToRowFields(request.requested_by),
    interactionType: 'assignment_requested',
    reason: null,
  }));
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
  return items.map((item, index) => ({
    id: `${prefix}-${index}-${item.text}`,
    primaryText: item.text,
    occurrenceCount: item.occurrence_count,
    timestamp: item.last_seen_at,
    ...userSummaryToRowFields(item.prompted_by),
    interactionType:
      item.source === 'module_requested'
        ? 'assignment_requested'
        : 'chatbot_served',
    reason,
  }));
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
