import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';

export function baseQuizItem(
  id: string,
  questionBn: string,
  questionOrder: number,
): import('@/features/module-library/api/adminModulesApi').AdminModuleQuizItem {
  return {
    id,
    question_order: questionOrder,
    question: { bn: questionBn },
    case_setup: null,
    options: { bn: ['a', 'b'], en: ['a', 'b'] },
    correct_indices: [0],
    explanation: null,
    difficulty: 'medium',
  };
}

export function emptyCard(
  id: string,
  titleBn: string,
  bodyBn: AdminModuleCard['body']['bn'] = [],
): AdminModuleCard {
  return {
    id,
    title: { bn: titleBn },
    body: { bn: bodyBn },
  };
}

export function baseAdminModuleDetail(
  overrides: Partial<AdminModuleDetailResponse> = {},
): AdminModuleDetailResponse {
  return {
    id: 'mod-1',
    module_family_id: 'family-1',
    version: 1,
    title: { bn: 'Module BN', en: 'Module EN' },
    description: { bn: 'Description BN', en: 'Description EN' },
    domain: 'rmnch',
    module_type: 'refresher',
    lifecycle_status: 'draft',
    clinically_reviewed: false,
    has_visibility_window: false,
    card_count: 0,
    estimated_minutes: 5,
    published_at: null,
    created_at: '2026-01-01T00:00:00Z',
    quality_flags: null,
    module_json: { cards: [], quiz: [] },
    cards: [],
    quiz: [],
    ...overrides,
  };
}
