import type {
  AlertsResponse,
  CHWPerformanceResponse,
  DashboardSummaryResponse,
  LeaderboardResponse,
  ModulesProgressResponse,
} from '@/types/supervisor.types';
import type { ChwDetailResponse } from '@/features/chw-profiles/types/chwProfiles.types';
import type { ModuleLibraryResponse } from '@/features/module-library/types/moduleLibrary.types';
import type { QuizPerformanceResponse } from '@/features/quiz-performance/types/quizPerformance.types';
import type { ReportsResponse } from '@/features/reports/types/reports.types';
import type {
  CourseDraftData,
  ProgramChwRosterResponse,
  ProgramEscalationsResponse,
  ProgramOverviewResponse,
  ProgramRankingsResponse,
  ProgramSupervisorListResponse,
  SupervisorDetailResponse,
} from '@/features/program-manager/types/programManager.types';

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

export const mockModuleLibrary: ModuleLibraryResponse = {
  modules: [
    {
      id: 'spice-visit',
      title: 'SPICE App — Visit Submission',
      category: 'SPICE App',
      lessons: 4,
      questions: 5,
      durationLabel: '~20 min',
      status: 'published',
      lastUpdated: '12 Apr 2026',
    },
    {
      id: 'htn-referral',
      title: 'HTN Referral Thresholds',
      category: 'Hypertension',
      lessons: 4,
      questions: 3,
      durationLabel: '~18 min',
      status: 'published',
      lastUpdated: '8 Apr 2026',
    },
    {
      id: 'community-clinic',
      title: 'Community Clinic Referral Protocol',
      category: 'Referral',
      lessons: 3,
      questions: 4,
      durationLabel: '~15 min',
      status: 'published',
      lastUpdated: '5 Apr 2026',
    },
    {
      id: 'fbs-rbs',
      title: 'FBS vs RBS — Timing Rules',
      category: 'Diabetes',
      lessons: 3,
      questions: 5,
      durationLabel: '~14 min',
      status: 'published',
      lastUpdated: '3 Apr 2026',
    },
    {
      id: 'med-adherence',
      title: 'Medication Adherence Counseling',
      category: 'SPICE App',
      lessons: 3,
      questions: 4,
      durationLabel: '~12 min',
      status: 'published',
      lastUpdated: '1 Apr 2026',
    },
    {
      id: 'danger-signs',
      title: 'Danger Signs in Pregnancy',
      category: 'Pregnancy',
      lessons: 5,
      questions: 6,
      durationLabel: '~22 min',
      status: 'published',
      lastUpdated: 'Overdue • 15 Apr',
    },
    {
      id: 'bp-technique',
      title: 'BP Measurement Technique',
      category: 'Hypertension',
      lessons: 2,
      questions: 0,
      durationLabel: '~10 min',
      status: 'draft',
      lastUpdated: '2 days ago',
      draftProgress: 'Step 2 of 4 — Lessons',
    },
    {
      id: 'insulin-guidance',
      title: 'Insulin Injection Guidance',
      category: 'Diabetes',
      lessons: 3,
      questions: 3,
      durationLabel: '~16 min',
      status: 'draft',
      lastUpdated: '5 days ago',
      draftProgress: 'Step 3 of 4 — Quiz',
    },
    {
      id: 'postnatal-checklist',
      title: 'Postnatal Care Checklist',
      category: 'Pregnancy',
      lessons: 1,
      questions: 0,
      durationLabel: '~5 min',
      status: 'draft',
      lastUpdated: '1 week ago',
      draftProgress: 'Step 2 of 4 — Lessons',
    },
  ],
};

export const mockQuizPerformance: QuizPerformanceResponse = {
  stats: {
    totalAttempts: 163,
    passed: 118,
    failed: 45,
    overallPassRatePct: 72,
    avgAttemptsToPass: 1.8,
    chwsBelow70: 8,
    totalChws: 30,
    chwsAbove70: 22,
    highestPassRatePct: 94,
    highestPassRateChwName: 'Fatema Jannat',
    totalQuestions: 28,
    highFailRateQuestions: 4,
    mostFailedModule: 'HTN Referral',
    freeTextCompletionPct: 61,
  },
  byModule: [
    {
      module: 'SPICE App — Visit Submission (Daily)',
      category: 'SPICE App',
      passRate: 91,
      attempts: 32,
      avgScore: 88,
      trend: 'up',
      trendValue: '+4%',
    },
    {
      module: 'Community Clinic Referral Protocol (Weekly)',
      category: 'Referral',
      passRate: 84,
      attempts: 38,
      avgScore: 81,
      trend: 'flat',
      trendValue: '0%',
    },
    {
      module: 'FBS vs RBS — Timing Rules (Monthly)',
      category: 'Diabetes',
      passRate: 78,
      attempts: 27,
      avgScore: 74,
      trend: 'up',
      trendValue: '+2%',
    },
    {
      module: 'Medication Adherence Counseling (Cohort A)',
      category: 'SPICE App',
      passRate: 71,
      attempts: 24,
      avgScore: 69,
      trend: 'down',
      trendValue: '-3%',
    },
    {
      module: 'HTN Referral Thresholds (Q2)',
      category: 'Hypertension',
      passRate: 62,
      attempts: 29,
      avgScore: 61,
      trend: 'down',
      trendValue: '-6%',
    },
    {
      module: 'Danger Signs in Pregnancy (Q2)',
      category: 'Pregnancy',
      passRate: 54,
      attempts: 13,
      avgScore: 57,
      trend: 'down',
      trendValue: '-8%',
    },
  ],
  byChw: [
    { name: 'Fatema Jannat', chw_id: 'CHW001', passRate: 94, attempts: 18 },
    { name: 'Momotaj Begum', chw_id: 'CHW002', passRate: 86, attempts: 22 },
    { name: 'Nasrin Khatun', chw_id: 'CHW003', passRate: 74, attempts: 15 },
    { name: 'Rina Akter', chw_id: 'CHW004', passRate: 63, attempts: 20 },
    { name: 'Sabina Khatun', chw_id: 'CHW005', passRate: 50, attempts: 28 },
  ],
  questions: [
    {
      id: 'q1',
      module: 'HTN Referral Thresholds',
      typeLabel: 'Multiple Choice',
      question:
        'At what BP reading should a CHW refer a patient to UHC immediately?',
      failRate: 68,
      answers: [
        { label: '160/100 mmHg or above', pct: 32, isCorrect: true },
        { label: '140/90 mmHg or above', pct: 46 },
        { label: '180/110 mmHg only', pct: 22 },
      ],
      note: 'CHWs are confusing the 140/90 community-level threshold with the 160/100 UHC referral threshold. Consider adding a comparison table in Lesson 3.',
    },
    {
      id: 'q2',
      module: 'Danger Signs in Pregnancy',
      typeLabel: 'Multi-Select',
      question:
        'Which of the following are danger signs in the third trimester? (Select all that apply)',
      failRate: 62,
      answers: [
        { label: 'Severe headache', pct: 92, isCorrect: true },
        { label: 'Blurred vision', pct: 77, isCorrect: true },
        { label: 'Reduced fetal movement', pct: 31, isCorrect: true },
        { label: 'Swelling of face and hands', pct: 28, isCorrect: true },
      ],
      note: 'Reduced fetal movement and facial swelling are being missed. These may need a dedicated lesson slide with visual examples.',
    },
  ],
};

export const mockReports: ReportsResponse = {
  stats: {
    activeChws: 30,
    locationLabel: 'Sylhet Sadar',
    modulesPublished: 6,
    modulesTotal: 9,
    modulesDrafts: 3,
    overallPassRateLabel: '72%',
    overallPassRateMeta: '118 / 163 attempts',
    avgCompletionLabel: '68%',
    avgCompletionMeta: 'across all modules',
  },
  available: [
    {
      id: 'chw-performance',
      title: 'CHW Performance Summary',
      description:
        'Individual pass rates, module completion, streaks, and flags for all CHWs in your Upazila.',
      cadenceLabel: 'Updated daily',
      formatsLabel: 'CSV / PDF',
      actionLabel: 'Download',
    },
    {
      id: 'quiz-analytics',
      title: 'Quiz Analytics Report',
      description:
        'Pass/fail rates per module, most failed questions, answer distribution, and weekly improvement suggestions.',
      cadenceLabel: 'Updated weekly',
      formatsLabel: 'CSV / PDF',
      actionLabel: 'Download',
    },
    {
      id: 'module-completion',
      title: 'Module Completion Tracker',
      description:
        'Completion status per module per CHW, deadline adherence, overdue assignments, and time spent.',
      cadenceLabel: 'Updated daily',
      formatsLabel: 'CSV',
      actionLabel: 'Download',
    },
    {
      id: 'flags-resolution',
      title: 'Flags & Resolution Log',
      description:
        'All flagged CHWs, severity, reasons, resolution notes, and time to resolve. Active & historical.',
      cadenceLabel: 'Real-time',
      formatsLabel: 'PDF',
      actionLabel: 'Download',
    },
  ],
  customCards: [
    {
      title: 'Date Range Report',
      subtitle:
        'Select a custom date range and filter by module, CHW, or status',
    },
    {
      title: 'Before & After Comparison',
      subtitle: 'Compare performance metrics between two time periods',
    },
    {
      title: 'AI-Generated Insights',
      subtitle:
        'AI analyzes patterns and generates improvement recommendations',
    },
  ],
};

export const mockProgramOverview: ProgramOverviewResponse = {
  kpis: [
    { label: 'Supervisors', value: 4, meta: 'all active' },
    { label: 'Total CHWs', value: 120, meta: 'across 4 supervisors' },
    { label: 'Courses Published', value: 6, meta: '3 in draft' },
    { label: 'Program Pass Rate', value: '74%', meta: '472 / 638 attempts' },
    { label: 'Escalations', value: 7, meta: '3 supervisors' },
  ],
  insight: {
    title: 'PROGRAM INSIGHT',
    description:
      'HTN Referral quiz scores are 18% lower under Rashida Khanam compared to other supervisors. The Danger Signs in Pregnancy module has the lowest completion rate across the program.',
    actionLabel: 'View Analysis',
  },
  supervisors: [
    {
      id: 'SUP001',
      initials: 'NI',
      name: 'Nasreen Islam',
      chws: 30,
      completionRate: 88,
      passRate: 81,
      flags: 0,
      trend: '+4% vs last month',
      trendDirection: 'up',
      rank: 1,
    },
    {
      id: 'SUP002',
      initials: 'AH',
      name: 'Ayesha Hossain',
      chws: 30,
      completionRate: 82,
      passRate: 79,
      flags: 2,
      trend: '+5% vs last month',
      trendDirection: 'up',
      rank: 2,
    },
    {
      id: 'SUP003',
      initials: 'SB',
      name: 'Sharmin Begum',
      chws: 30,
      completionRate: 75,
      passRate: 76,
      flags: 1,
      trend: '+2% vs last month',
      trendDirection: 'up',
      rank: 3,
    },
    {
      id: 'SUP004',
      initials: 'RK',
      name: 'Rashida Khanam',
      chws: 30,
      completionRate: 68,
      passRate: 72,
      flags: 4,
      trend: '-3% vs last month',
      trendDirection: 'down',
      rank: 4,
    },
  ],
};

export const mockProgramSupervisors: ProgramSupervisorListResponse = {
  supervisors: mockProgramOverview.supervisors.map((item) => ({
    id: item.id,
    name: item.name,
    location: 'Sylhet Sadar',
    chws: item.chws,
    completionRate: item.completionRate,
    passRate: item.passRate,
    flags: item.flags,
  })),
};

export const mockProgramSupervisorDetails: Record<
  string,
  SupervisorDetailResponse
> = {
  SUP004: {
    id: 'SUP004',
    name: 'Rashida Khanam',
    location: 'Sylhet Sadar',
    stats: [
      { label: 'CHWs Managed', value: 30, meta: 'all active' },
      { label: 'Modules Assigned', value: 68, meta: '41 completed' },
      { label: 'Avg. Response', value: '1.2d', meta: 'flag resolution' },
      { label: 'Trend', value: '-3%', meta: 'vs last month' },
    ],
    performanceRows: [
      {
        chwId: 'SK-001',
        name: 'Fatema Jannat',
        modulesDone: '6/6',
        passRate: '94%',
        status: 'On Track',
      },
      {
        chwId: 'SK-002',
        name: 'Momotaj Begum',
        modulesDone: '5/6',
        passRate: '86%',
        status: 'On Track',
      },
      {
        chwId: 'SK-003',
        name: 'Rina Akter',
        modulesDone: '3/6',
        passRate: '63%',
        status: 'Overdue',
      },
      {
        chwId: 'SK-025',
        name: 'Sabina Khatun',
        modulesDone: '2/6',
        passRate: '50%',
        status: 'Flagged',
      },
    ],
    moduleRows: [
      {
        module: 'SPICE App - Visit Submission',
        completed: '30/30',
        passRate: '91%',
        overdue: '-',
      },
      {
        module: 'HTN Referral Thresholds',
        completed: '26/30',
        passRate: '62%',
        overdue: '4 CHWs',
      },
      {
        module: 'FBS vs RBS - Timing Rules',
        completed: '21/30',
        passRate: '78%',
        overdue: '2 CHWs',
      },
      {
        module: 'Danger Signs in Pregnancy',
        completed: '8/30',
        passRate: '54%',
        overdue: '9 CHWs',
      },
    ],
  },
};

export const mockProgramChwRoster: ProgramChwRosterResponse = {
  rows: [
    {
      id: 'SK-001',
      name: 'Fatema Jannat',
      supervisor: 'Rashida Khanam',
      modules: '6/6',
      passRate: '94%',
      status: 'On Track',
    },
    {
      id: 'SK-002',
      name: 'Momotaj Begum',
      supervisor: 'Rashida Khanam',
      modules: '5/6',
      passRate: '86%',
      status: 'On Track',
    },
    {
      id: 'SK-0025',
      name: 'Sabina Khatun',
      supervisor: 'Rashida Khanam',
      modules: '2/6',
      passRate: '50%',
      status: 'Flagged',
    },
    {
      id: 'SK-0041',
      name: 'Laila Sultana',
      supervisor: 'Ayesha Hossain',
      modules: '5/6',
      passRate: '82%',
      status: 'On Track',
    },
    {
      id: 'SK-0055',
      name: 'Zohra Rahman',
      supervisor: 'Sharmin Begum',
      modules: '4/6',
      passRate: '77%',
      status: 'In Progress',
    },
  ],
};

export const mockProgramEscalations: ProgramEscalationsResponse = {
  rows: [
    {
      id: 'ESC-1',
      chwName: 'Sabina Khatun',
      supervisor: 'Rashida Khanam',
      reason: 'Low pass rate for 2 weeks',
      severity: 'High',
      updatedAt: 'Today',
    },
    {
      id: 'ESC-2',
      chwName: 'Rina Akter',
      supervisor: 'Rashida Khanam',
      reason: 'Overdue assignments',
      severity: 'High',
      updatedAt: '1 day ago',
    },
    {
      id: 'ESC-3',
      chwName: 'Zohra Rahman',
      supervisor: 'Sharmin Begum',
      reason: 'Repeated late submissions',
      severity: 'Medium',
      updatedAt: '2 days ago',
    },
  ],
};

export const mockProgramRankings: ProgramRankingsResponse = {
  rows: [
    {
      id: 'R1',
      supervisor: 'Nasreen Islam',
      completionRate: '88%',
      passRate: '81%',
      flags: '0',
      rank: '#1',
    },
    {
      id: 'R2',
      supervisor: 'Ayesha Hossain',
      completionRate: '82%',
      passRate: '79%',
      flags: '2',
      rank: '#2',
    },
    {
      id: 'R3',
      supervisor: 'Sharmin Begum',
      completionRate: '75%',
      passRate: '76%',
      flags: '1',
      rank: '#3',
    },
    {
      id: 'R4',
      supervisor: 'Rashida Khanam',
      completionRate: '68%',
      passRate: '72%',
      flags: '4',
      rank: '#4',
    },
  ],
};

export const mockCourseDraft: CourseDraftData = {
  id: 'draft-htn-referral',
  title: '',
  topic: '',
  description: '',
  sourceFile: '',
  status: 'draft',
  generationStatus: 'idle',
  generatedAt: '',
  moduleDetails: {
    description: [],
    estimatedTime: 0,
  },
  lessons: [],
  moduleContent: {
    fieldMessage: '',
    objectives: [],
    dangerSigns: [],
    lessonContent: '',
  },
  quiz: {
    instructions: '',
    config: {
      shuffleQuestions: true,
      evaluationBehavior: 'immediate',
      explanationVisibility: 'after_answer',
    },
    questions: [],
  },
  estimateMinutes: 0,
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
