export type ChwDeadlineStatus = 'on_time' | 'overdue' | 'due_soon';

export type ChwOverallStatus =
  | 'on_track'
  | 'in_progress'
  | 'overdue'
  | 'flagged';

export interface ChwProfilesListRow {
  chw_id: string;
  name: string;
  modules_done: number;
  modules_total: number;
  deadline_status: ChwDeadlineStatus;
  quiz_passed: number;
  quiz_failed: number;
  pass_rate: number;
  streak: number;
  last_active: string;
  overall_status: ChwOverallStatus;
}

export interface ChwProfilesListResponse {
  data: ChwProfilesListRow[];
}

export interface ChwPerformance {
  modules_completed: number;
  modules_total: number;
  application_days: number;
  quiz_accuracy: number;
  total_attempts: number;
}

export interface ChwMeta {
  joined: string;
  last_active: string;
  total_points: number;
  leaderboard_rank: number;
  badges: number;
}

export type ChwModuleStatus = 'completed' | 'in_progress';

export interface ChwModuleProgressItem {
  title: string;
  status: ChwModuleStatus;
  pass_rate: number;
  attempts: number;
  due_date: string;
}

export type ChwQuizStatus = 'pass' | 'fail';

export interface ChwQuizHistoryItem {
  title: string;
  score: number;
  date: string;
  status: ChwQuizStatus;
}

export interface ChwDetailResponse {
  chw_id: string;
  name: string;
  performance: ChwPerformance;
  meta: ChwMeta;
  modules: ChwModuleProgressItem[];
  quiz_history: ChwQuizHistoryItem[];
}
