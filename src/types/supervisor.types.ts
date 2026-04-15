export type SupervisorStatus = 'on_track' | 'due_soon' | 'delayed' | 'inactive';

export type AlertSeverity = 'critical' | 'warning' | 'info';

// --- UC-3 API response types (must match backend exactly) ---

export type KpiStatus = 'info' | 'good' | 'warning' | 'critical';

export type KpiBase = {
  id: string;
  title: string;
  /** Runtime rendering hint from API. */
  type: 'number' | 'progress' | 'alert';
  /** Semantic status from API (drives tone). */
  status: KpiStatus;
  unit: string | null;
};

export type NumberKpi = KpiBase & {
  type: 'number';
  value: number;
};

export type ProgressKpi = KpiBase & {
  type: 'progress';
  value: number;
  total: number;
  percentage: number;
};

export type AlertKpi = KpiBase & {
  type: 'alert';
  value: number;
  meta?: Record<string, string>;
};

export type DashboardSummaryKpi = NumberKpi | ProgressKpi | AlertKpi;

export interface DashboardSummaryResponse {
  kpis: DashboardSummaryKpi[];
  insight: {
    type: string;
    title: string;
    description: string;
    recommended_action: string;
    peak_engagement_time: string;
    affected_chw_count: number;
  };
}

export interface LeaderboardItem {
  chw_id: string;
  name: string;
  score: number;
  rank: number;
  completion_rate: number;
  trend: 'up' | 'down' | 'flat';
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
}

export interface PerformanceAlertItem {
  chw_id: string;
  name: string;
  flag_type: string;
  severity: 'high' | 'medium' | 'low';
  message?: string;
  details?: string;
  last_active_days?: number;
  actions?: string[];
}

export interface AlertsResponse {
  flags: PerformanceAlertItem[];
}

export interface CHWPerformanceRow {
  chw_id: string;
  name: string;
  modules_done: number;
  modules_total: number;
  deadline_status: SupervisorStatus;
  pass_count: number;
  fail_count: number;
  overall_status: SupervisorStatus | 'in_progress';
}

export interface CHWPerformanceResponse {
  data: CHWPerformanceRow[];
}

export interface ModuleProgressItem {
  module_id: string;
  name: string;
  completion_pct: number;
  status: SupervisorStatus;
}

export interface ModulesProgressResponse {
  data: ModuleProgressItem[];
}
