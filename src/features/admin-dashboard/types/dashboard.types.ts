import type { LocalizedString } from '@/types/localized';

export type DashboardDurationPreset =
  | 'all_time'
  | 'this_week'
  | 'this_month'
  | 'custom';

export type DashboardStatusFilter = 'all' | 'on_track' | 'at_risk';

export type TeamHierarchySortKey =
  | 'default'
  | 'at_risk_first'
  | 'lowest_completion'
  | 'lowest_chatbot'
  | 'most_inactive'
  | 'name';

export interface DashboardGeographyFilters {
  /** Division display name sent as dashboard `division` query param. */
  division: string;
  /** District display name (also the document-usage `district` query value). */
  district: string;
  /**
   * Upazila display name. Sent as document-usage `upazila_id` because the
   * platform currently resolves that param by name (see DASHBOARD_BE_LEFTOVERS §6).
   */
  upazila: string;
}

export interface DashboardDateRange {
  fromDate: string;
  toDate: string;
}

export interface DashboardFiltersState {
  durationPreset: DashboardDurationPreset;
  customFrom: string;
  customTo: string;
  status: DashboardStatusFilter;
  geography: DashboardGeographyFilters;
}

export interface TeamActivitySummary {
  total_users: number;
  active_users: number;
  non_active_users: number;
  users_completed_module: number;
  users_chatbot_engaged: number;
}

export interface TeamMemberModuleActivity {
  module_id: string;
  title: LocalizedString | null;
  completed_in_range: boolean;
  completed_at: string | null;
}

export interface TeamMemberChatbotModuleUsage {
  module_id: string;
  title: LocalizedString | null;
  query_count: number;
}

export interface TeamActivityMember {
  user_id: number;
  name: string;
  role: string;
  can_drill_down: boolean;
  is_active: boolean;
  is_chatbot_engaged: boolean;
  last_chat_at: string | null;
  last_active_at: string | null;
  has_completed_module_in_range: boolean;
  assigned_modules: TeamMemberModuleActivity[];
  chatbot_query_count: number;
  chatbot_unattributed_query_count: number;
  chatbot_modules: TeamMemberChatbotModuleUsage[];
  refreshers_generated: number;
  refreshers_completed: number;
  /** Descendant rollup for AM/PO rows; present without expanding the hierarchy. */
  summary?: TeamActivitySummary;
}

export interface TeamActivityResponse {
  from_date: string;
  to_date: string;
  summary: TeamActivitySummary;
  members: TeamActivityMember[];
  focus_user_id: number | null;
  total_users: number;
  total_members: number;
  total_pages: number;
  limit: number;
  offset: number;
  server_time_utc: string;
}

export interface TeamMemberQuestionItem {
  question: string;
  occurrence_count: number;
  last_asked_at: string;
}

export interface DigitalHelpModuleUsageItem {
  module_id: string;
  module_family_id: string | null;
  digital_help_count: number;
  module_requested_count: number;
  title: LocalizedString | null;
}

export interface DigitalHelpModuleUsageResponse {
  from_date: string;
  to_date: string;
  total_digital_help: number;
  total_module_requested: number;
  total_modules: number;
  limit: number;
  offset: number;
  modules: DigitalHelpModuleUsageItem[];
}

export interface DashboardUserSummary {
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
}

export interface DigitalHelpModuleQuestionItem {
  question: string;
  occurrence_count: number;
  last_asked_at: string;
  asked_by: DashboardUserSummary;
}

export interface DigitalHelpModuleRequestItem {
  requested_at: string;
  reason: string | null;
  requested_by: DashboardUserSummary;
}

export interface DigitalHelpModuleQuestionsResponse {
  module_id: string;
  title: LocalizedString | null;
  from_date: string;
  to_date: string;
  questions: DigitalHelpModuleQuestionItem[];
  total_questions: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface DigitalHelpModuleRequestsResponse {
  module_id: string;
  title: LocalizedString | null;
  from_date: string;
  to_date: string;
  requests: DigitalHelpModuleRequestItem[];
  total_requests: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface PublishedModuleCompletionItem {
  module_id: string;
  module_family_id: string;
  title: LocalizedString | null;
  published_at: string;
  completed_sk_count: number;
  total_descendant_sk_count: number;
}

export interface PublishedModuleCompletionsResponse {
  from_date: string;
  to_date: string;
  total_modules: number;
  total_descendant_sk_count: number;
  limit: number;
  offset: number;
  modules: PublishedModuleCompletionItem[];
}

export interface ModuleCreationSuggestionEvidenceItem {
  source: string;
  text: string;
  occurrence_count: number;
  last_seen_at: string | null;
  prompted_by: DashboardUserSummary;
}

export interface ModuleCreationSuggestionListItem {
  id: string;
  suggestion_date: string;
  suggestion_kind: string;
  matched_module_id: string | null;
  proposed_topic: string | null;
  display_title: string;
  rationale: string | null;
  question_count: number;
  request_count: number;
  evidence_count: number;
  rank: number;
  computed_at: string;
}

export interface ModuleCreationSuggestionListResponse {
  from_date: string;
  to_date: string;
  suggestions: ModuleCreationSuggestionListItem[];
  total_suggestions: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface ModuleCreationSuggestionDetailResponse {
  suggestion: ModuleCreationSuggestionListItem;
  questions: ModuleCreationSuggestionEvidenceItem[];
  requests: ModuleCreationSuggestionEvidenceItem[];
}

export interface DocumentUsageTopItem {
  document_id: string;
  document_title: string | null;
  view_count: number;
}

export interface DocumentUsageDocumentRow {
  document_id: string;
  document_title: string | null;
  total_views: number;
  unique_users: number;
  last_viewed_at: string | null;
  last_viewed_by_user_id: number | null;
  last_viewed_by_user_name: string | null;
}

export interface DocumentUsageEventRow {
  event_id: string;
  document_id: string;
  document_title: string | null;
  user_id: number;
  user_name: string | null;
  user_role: string | null;
  upazila_id: string | null;
  district: string | null;
  viewed_at: string | null;
}

export interface DocumentUsageResponse {
  from_date: string;
  to_date: string;
  total_views: number;
  unique_documents: number;
  unique_users: number;
  top_documents: DocumentUsageTopItem[];
  total_document_rows: number;
  documents: DocumentUsageDocumentRow[];
  total_events: number;
  events: DocumentUsageEventRow[];
  documents_limit: number;
  documents_offset: number;
  events_limit: number;
  events_offset: number;
}

/** Hierarchy person selected to scope document-usage analytics. */
export interface HierarchyFocusSelection {
  userId: number;
  userName: string;
}

export type ModuleDemandInteractionType =
  | 'chatbot_served'
  | 'assignment_requested';

export interface ModuleDemandUserEntry {
  skId: number | null;
  skName: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  timestamp: string | null;
}

export interface ModuleDemandQueryRow {
  id: string;
  primaryText: string;
  occurrenceCount: number;
  timestamp: string | null;
  skId: number | null;
  skName: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  interactionType: ModuleDemandInteractionType;
  reason: string | null;
  users: ModuleDemandUserEntry[];
}
