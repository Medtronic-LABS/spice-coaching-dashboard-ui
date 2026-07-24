import type { RichBlock } from '@/features/modules/types/richText.types';

export interface ModuleDraftData {
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
