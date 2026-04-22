import type {
  AlertsResponse,
  CHWPerformanceResponse,
  DashboardSummaryResponse,
  LeaderboardResponse,
  ModulesProgressResponse,
} from '@/types/supervisor.types';
import type { ChwDetailResponse } from '@/features/chw-profiles/types/chwProfiles.types';

export const mockDashboardSummary: DashboardSummaryResponse = {
  kpis: [
    {
      id: 'kpi-modules-completed',
      title: 'Modules Completed',
      type: 'progress',
      status: 'info',
      value: 41,
      total: 68,
      percentage: 60,
      change: 12,
      supporting_text: 'of 68 assigned this cycle',
    },
    {
      id: 'kpi-quizzes-passed',
      title: 'Quizzes Passed',
      type: 'number',
      status: 'info',
      value: 118,
      change: 5.4,
      supporting_text: 'of 163 attempted • 72% pass rate',
    },
    {
      id: 'kpi-need-attention',
      title: 'Need Attention',
      type: 'alert',
      status: 'critical',
      value: 4,
      meta: { district: 'Sylhet' },
      supporting_text: 'CHWs flagged for critical low performance',
    },
  ],
  insight: {
    type: 'engagement',
    title: 'AI INSIGHT',
    description:
      'Document analysed. Found 4 lesson topics and 12 potential quiz questions. Recommend including a section on local colloquialisms for "high blood pressure" to improve CHW communication efficacy.',
    recommended_action: 'Review →',
    peak_engagement_time: '14:00–17:00',
    affected_chw_count: 8,
  },
};

export const mockLeaderboard: LeaderboardResponse = {
  leaderboard: [
    {
      chw_id: 'CHW001',
      name: 'Fatema Jannat',
      score: 3840,
      rank: 1,
      completion_rate: 98,
      trend: 'up',
      courses: ['Heart Course', 'Heart Course'],
    },
    {
      chw_id: 'CHW002',
      name: 'Momotaj Begum',
      score: 3410,
      rank: 2,
      completion_rate: 96,
      trend: 'flat',
      courses: ['Heart Course', 'Heart Course'],
    },
    {
      chw_id: 'CHW003',
      name: 'Fatema Jannat',
      score: 3140,
      rank: 3,
      completion_rate: 98,
      trend: 'up',
      courses: ['Heart Course', 'Heart Course'],
    },
    {
      chw_id: 'CHW004',
      name: 'Momotaj Begum',
      score: 2310,
      rank: 4,
      completion_rate: 86,
      trend: 'down',
      courses: ['Heart Course', 'Heart Course'],
    },
  ],
};

export const mockPerformanceMatrix: CHWPerformanceResponse = {
  data: [
    {
      chw_id: 'CHW001',
      name: 'Fatema Jannat',
      modules_done: 6,
      modules_total: 6,
      deadline_status: 'on_time',
      quiz_passed: 18,
      quiz_failed: 2,
      overall_status: 'on_track',
    },
    {
      chw_id: 'CHW002',
      name: 'Momotaj Begum',
      modules_done: 5,
      modules_total: 6,
      deadline_status: 'on_time',
      quiz_passed: 22,
      quiz_failed: 5,
      overall_status: 'on_track',
    },
    {
      chw_id: 'CHW003',
      name: 'Nasrin Khatun',
      modules_done: 4,
      modules_total: 6,
      deadline_status: 'due_soon',
      quiz_passed: 15,
      quiz_failed: 5,
      overall_status: 'in_progress',
    },
    {
      chw_id: 'CHW004',
      name: 'Rina Akter',
      modules_done: 3,
      modules_total: 6,
      deadline_status: 'delayed',
      quiz_passed: 12,
      quiz_failed: 8,
      overall_status: 'delayed',
    },
    {
      chw_id: 'CHW005',
      name: 'Emma Chen',
      modules_done: 5,
      modules_total: 6,
      deadline_status: 'on_time',
      quiz_passed: 20,
      quiz_failed: 2,
      overall_status: 'on_track',
    },
  ],
  pagination: { page: 1, total: 5 },
};

export const mockFlags: AlertsResponse = {
  flags: [
    {
      chw_id: 'CHW004',
      name: 'Rina Akter',
      flag_type: 'overdue_modules',
      severity: 'high',
      message: 'Overdue modules detected',
      details: '3 modules overdue by 1–3 days',
      last_active_days: 2,
      actions: ['Mentor call', 'Assign module'],
    },
    {
      chw_id: 'CHW003',
      name: 'Nasrin Khatun',
      flag_type: 'low_accuracy',
      severity: 'medium',
      message: 'Quiz accuracy trending down',
      details: 'Accuracy dropped below 75% in last 7 days',
      last_active_days: 1,
      actions: ['Review materials'],
    },
  ],
};

export const mockModules: ModulesProgressResponse = {
  data: [
    {
      module_id: 'MOD001',
      name: 'HTN Referral Thresholds',
      progress: 100,
      status: 'on_track',
      completed: 30,
      total: 30,
    },
    {
      module_id: 'MOD002',
      name: 'FBS vs RBS — Timing Rules',
      progress: 72,
      status: 'due_soon',
      completed: 18,
      total: 25,
    },
    {
      module_id: 'MOD003',
      name: 'Danger Signs in Pregnancy',
      progress: 41,
      status: 'delayed',
      completed: 9,
      total: 22,
    },
  ],
};

export function getMockChwDetail(chwId: string): ChwDetailResponse {
  const nameMap: Record<string, string> = {
    CHW001: 'Fatema Jannat',
    CHW002: 'Momotaj Begum',
    CHW003: 'Nasrin Khatun',
    CHW004: 'Rina Akter',
    CHW005: 'Emma Chen',
  };

  const name = nameMap[chwId] ?? 'CHW Member';

  return {
    chw_id: chwId,
    name,
    performance: {
      modules_completed: 2,
      modules_total: 6,
      application_days: 14,
      quiz_accuracy: 87,
      total_attempts: 18,
    },
    meta: {
      joined: 'Jan 2025',
      last_active: 'Today, 2:14 PM',
      total_points: 3840,
      leaderboard_rank: 1,
      badges: 7,
    },
    modules: [
      {
        title: 'HTN Referral Thresholds',
        status: 'completed',
        pass_rate: 87,
        attempts: 17,
        due_date: '2026-04-12',
      },
      {
        title: 'FBS vs RBS — Timing Rules',
        status: 'completed',
        pass_rate: 92,
        attempts: 5,
        due_date: '2026-04-09',
      },
      {
        title: 'Danger Signs in Pregnancy',
        status: 'completed',
        pass_rate: 83,
        attempts: 6,
        due_date: '2026-04-05',
      },
      {
        title: 'Medication Adherence Counseling',
        status: 'in_progress',
        pass_rate: 60,
        attempts: 3,
        due_date: '2026-04-17',
      },
    ],
    quiz_history: [
      {
        title: 'HTN Referral Thresholds — Final Quiz',
        score: 90,
        date: '2026-04-12',
        status: 'pass',
      },
      {
        title: 'HTN Referral Thresholds — Final Quiz (Attempt 1)',
        score: 55,
        date: '2026-04-11',
        status: 'fail',
      },
      {
        title: 'FBS vs RBS — Timing Rules',
        score: 100,
        date: '2026-04-09',
        status: 'pass',
      },
      {
        title: 'Danger Signs in Pregnancy',
        score: 83,
        date: '2026-04-05',
        status: 'pass',
      },
    ],
  };
}
