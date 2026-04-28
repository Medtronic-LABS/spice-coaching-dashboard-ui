export type Trend = 'up' | 'down' | 'flat';

export interface QuizByModuleRow {
  module: string;
  category: string;
  passRate: number;
  attempts: number;
  avgScore: number;
  trend: Trend;
  trendValue: string;
}

export interface QuizByChwRow {
  name: string;
  chw_id: string;
  passRate: number;
  attempts: number;
}

export type QuestionTypeLabel = 'Multiple Choice' | 'Multi-Select';

export interface QuizQuestionAnswer {
  label: string;
  pct: number;
  isCorrect?: boolean;
}

export interface QuizQuestionRow {
  id: string;
  module: string;
  typeLabel: QuestionTypeLabel;
  question: string;
  failRate: number;
  answers: QuizQuestionAnswer[];
  note: string;
}

export interface QuizPerformanceStats {
  totalAttempts: number;
  passed: number;
  failed: number;
  overallPassRatePct: number;
  avgAttemptsToPass: number;
  chwsBelow70: number;
  totalChws: number;
  chwsAbove70: number;
  highestPassRatePct: number;
  highestPassRateChwName: string;
  totalQuestions: number;
  highFailRateQuestions: number;
  mostFailedModule: string;
  freeTextCompletionPct: number;
}

export interface QuizPerformanceResponse {
  stats: QuizPerformanceStats;
  byModule: QuizByModuleRow[];
  byChw: QuizByChwRow[];
  questions: QuizQuestionRow[];
}
