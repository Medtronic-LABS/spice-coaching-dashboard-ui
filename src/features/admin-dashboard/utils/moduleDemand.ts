import type {
  DigitalHelpModuleUsageItem,
  ModuleDemandQueryRow,
  TeamMemberQuestionItem,
} from '@/features/admin-dashboard/types/dashboard.types';

export const TOP_MODULE_DEMAND_LIMIT = 10;
/** Fetch enough rows for independent client-side ranking (backend max is 100). */
export const MODULE_DEMAND_FETCH_LIMIT = 100;

export function existingModuleSearchCount(
  module: DigitalHelpModuleUsageItem,
): number {
  return module.digital_help_count;
}

export function suggestedModuleRequestCount(
  module: DigitalHelpModuleUsageItem,
): number {
  return module.module_requested_count;
}

export function sortExistingModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return [...modules].sort(
    (a, b) => b.digital_help_count - a.digital_help_count,
  );
}

export function sortRequestedModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return [...modules].sort(
    (a, b) => b.module_requested_count - a.module_requested_count,
  );
}

export function filterAndRankSearchedModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return sortExistingModules(modules)
    .filter((module) => module.digital_help_count > 0)
    .slice(0, TOP_MODULE_DEMAND_LIMIT);
}

export function filterAndRankSuggestedModules(
  modules: DigitalHelpModuleUsageItem[],
): DigitalHelpModuleUsageItem[] {
  return sortRequestedModules(modules)
    .filter((module) => module.module_requested_count > 0)
    .slice(0, TOP_MODULE_DEMAND_LIMIT);
}

export function mapDigitalHelpQuestionsToRows(
  questions: TeamMemberQuestionItem[],
): ModuleDemandQueryRow[] {
  return questions.map((question, index) => ({
    id: `question-${index}-${question.question}`,
    primaryText: question.question,
    occurrenceCount: question.occurrence_count,
    timestamp: question.last_asked_at,
    skId: null,
    skName: null,
    district: null,
    upazila: null,
    interactionType: 'chatbot_served',
    reason: null,
  }));
}

export function matchesGeographyFilter(
  row: ModuleDemandQueryRow,
  district: string,
  upazila: string,
): boolean {
  const districtFilter = district.trim().toLowerCase();
  const upazilaFilter = upazila.trim().toLowerCase();
  if (!districtFilter && !upazilaFilter) return true;
  if (districtFilter && row.district) {
    if (row.district.trim().toLowerCase() !== districtFilter) return false;
  }
  if (upazilaFilter && row.upazila) {
    if (row.upazila.trim().toLowerCase() !== upazilaFilter) return false;
  }
  return true;
}
