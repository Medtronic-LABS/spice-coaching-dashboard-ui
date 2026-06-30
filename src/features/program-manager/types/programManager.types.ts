export interface ProgramManagerOverviewKpi {
  label: string;
  value: string | number;
  meta: string;
}

export interface ProgramInsight {
  title: string;
  description: string;
  actionLabel: string;
}

export interface SupervisorCard {
  id: string;
  initials: string;
  name: string;
  chws: number;
  completionRate: number;
  passRate: number;
  flags: number;
  trend: string;
  trendDirection: 'up' | 'down';
  rank: number;
}

export interface ProgramOverviewResponse {
  kpis: ProgramManagerOverviewKpi[];
  insight: ProgramInsight;
  supervisors: SupervisorCard[];
}

export interface SupervisorPerformanceRow {
  chwId: string;
  name: string;
  modulesDone: string;
  passRate: string;
  status: string;
}

export interface SupervisorModuleRow {
  module: string;
  completed: string;
  passRate: string;
  overdue: string;
}

export interface SupervisorDetailResponse {
  id: string;
  name: string;
  location: string;
  stats: ProgramManagerOverviewKpi[];
  performanceRows: SupervisorPerformanceRow[];
  moduleRows: SupervisorModuleRow[];
}

export interface ProgramSupervisorListResponse {
  supervisors: Array<{
    id: string;
    name: string;
    location: string;
    chws: number;
    completionRate: number;
    passRate: number;
    flags: number;
  }>;
}

export interface ProgramChwRosterResponse {
  rows: Array<{
    id: string;
    name: string;
    supervisor: string;
    modules: string;
    passRate: string;
    status: string;
  }>;
}

export interface ProgramEscalationsResponse {
  rows: Array<{
    id: string;
    chwName: string;
    supervisor: string;
    reason: string;
    severity: 'High' | 'Medium' | 'Low';
    updatedAt: string;
  }>;
}

export interface ProgramRankingsResponse {
  rows: Array<{
    id: string;
    supervisor: string;
    completionRate: string;
    passRate: string;
    flags: string;
    rank: string;
  }>;
}

export type RichTextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string } };

export interface RichTextLeaf {
  type: 'text';
  text: string;
  marks?: RichTextMark[];
}

export interface RichParagraphBlock {
  type: 'paragraph';
  content: RichTextLeaf[];
}

export interface RichHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: RichTextLeaf[];
}

export interface RichBlockquoteBlock {
  type: 'blockquote';
  content: RichBlock[];
}

export interface RichCodeBlock {
  type: 'code_block';
  text: string;
}

export interface RichHorizontalRuleBlock {
  type: 'horizontal_rule';
}

export type RichListItemContent =
  | RichParagraphBlock
  | RichHeadingBlock
  | RichBlockquoteBlock
  | RichCodeBlock
  | RichHorizontalRuleBlock
  | RichListBlock
  | RichImageBlock
  | RichVideoBlock
  | RichAudioBlock;

export interface RichListItem {
  content: RichListItemContent[];
}

export interface RichListBlock {
  type: 'bullet_list' | 'ordered_list';
  items: RichListItem[];
  /** First item number for ordered lists (defaults to 1). */
  start?: number;
}

/** File metadata from admin upload; use `object_name` with presigned URL for display. */
export interface RichStoredFileAttrs {
  object_name?: string;
  content_type?: string;
  original_filename?: string;
  /** Legacy direct admin files URL */
  url?: string;
}

export interface RichImageBlock {
  type: 'image';
  attrs: RichStoredFileAttrs & { caption?: string };
}

export interface RichAudioBlock {
  type: 'audio';
  attrs: { url: string; title?: string; duration?: number };
}

export interface RichVideoBlock {
  type: 'video';
  attrs: RichStoredFileAttrs & { thumbnail?: string };
}

export type RichBlock =
  | RichParagraphBlock
  | RichHeadingBlock
  | RichBlockquoteBlock
  | RichCodeBlock
  | RichHorizontalRuleBlock
  | RichListBlock
  | RichImageBlock
  | RichAudioBlock
  | RichVideoBlock;

export interface CourseDraftData {
  id: string;
  /** Backend admin module id (UUID) when draft was created from the module-creation pipeline */
  backendModuleId?: string;
  documentId?: string;
  /** Read-only mode (view existing module details without editing) */
  isReadOnly?: boolean;
  title: string;
  topic: string;
  description: string;
  sourceFile: string;
  status: 'draft' | 'published';
  generationStatus: 'idle' | 'generated';
  generatedAt: string;
  moduleDetails: {
    description: RichBlock[];
    estimatedTime: number;
  };
  lessons: Array<{
    id: string;
    title: string;
    order: number;
    content: RichBlock[];
  }>;
  moduleContent: {
    fieldMessage: string;
    objectives: string[];
    dangerSigns: string[];
    lessonContent: string;
  };
  quiz: {
    instructions: string;
    config: {
      shuffleQuestions: boolean;
      evaluationBehavior: 'immediate' | 'deferred';
      explanationVisibility: 'after_answer' | 'always';
    };
    questions: Array<{
      id: number;
      type: 'multiple_choice' | 'mcq';
      question: RichBlock[];
      options: Array<{ id: string; text: RichBlock[] }>;
      explanation: RichBlock[];
      answerIndex: number;
      correctAnswers: string[];
      difficulty: 'easy' | 'moderate' | 'hard';
      questionType: 'knowledge' | 'application';
      multi?: boolean;
    }>;
  };
  estimateMinutes: number;
}
