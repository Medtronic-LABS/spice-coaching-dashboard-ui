import type { RichBlock } from '@/features/program-manager/types/programManager.types';

export type ModulePreviewPhase = 'card' | 'quiz';

export interface ModulePreviewPosition {
  phase: ModulePreviewPhase;
  index: number;
}

export interface PreviewCard {
  index: number;
  title: string;
  body: RichBlock[];
}

export interface PreviewQuizItem {
  index: number;
  id: string;
  question: string;
  caseSetup: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModulePreviewSnapshot {
  moduleTitle: string;
  cards: PreviewCard[];
  quiz: PreviewQuizItem[];
  syncedAt: number;
}
