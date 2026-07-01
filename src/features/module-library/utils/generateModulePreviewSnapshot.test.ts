import { describe, expect, it } from 'vitest';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import { generateModulePreviewSnapshot } from '@/features/module-library/utils/generateModulePreviewSnapshot';

function card(
  id: string,
  titleBn: string | null,
  titleEn?: string | null,
  bodyBn?: AdminModuleCard['body']['bn'],
): AdminModuleCard {
  const title: AdminModuleCard['title'] = {};
  if (titleBn) title.bn = titleBn;
  if (titleEn) title.en = titleEn;
  return {
    id,
    title,
    body: {
      bn: bodyBn ?? [
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ],
    },
  };
}

function quizItem(
  id: string,
  question_order: number,
  overrides: Partial<AdminModuleQuizItem> = {},
): AdminModuleQuizItem {
  return {
    id,
    question_order,
    question: overrides.question ?? { bn: `Question ${id}` },
    case_setup: overrides.case_setup ?? null,
    options: overrides.options ?? {
      bn: ['Option A', 'Option B', 'Option C'],
      en: ['A', 'B', 'C'],
    },
    correct_indices: overrides.correct_indices ?? [1],
    explanation: overrides.explanation ?? { bn: 'Because reasons' },
    difficulty: 'medium',
    ...overrides,
  };
}

describe('generateModulePreviewSnapshot', () => {
  it('maps cards in editor array order with matching indices', () => {
    const module = {
      title: { bn: 'মডিউল', en: 'Module' },
      cards: [card('c0', 'Card 0'), card('c1', 'Card 1'), card('c2', 'Card 2')],
      quiz: [],
    };

    const snapshot = generateModulePreviewSnapshot(module);

    expect(snapshot.cards).toHaveLength(3);
    expect(snapshot.cards.map((c) => c.index)).toEqual([0, 1, 2]);
    expect(snapshot.cards.map((c) => c.title)).toEqual([
      'Card 0',
      'Card 1',
      'Card 2',
    ]);
  });

  it('preserves input card array order regardless of card_order field', () => {
    const module = {
      title: { en: 'Module' },
      cards: [
        { ...card('c2', 'Second'), card_order: 2 },
        { ...card('c1', 'First'), card_order: 1 },
        { ...card('c3', 'Third'), card_order: 3 },
      ],
      quiz: [],
    };

    const snapshot = generateModulePreviewSnapshot(module);

    expect(snapshot.cards.map((c) => c.title)).toEqual([
      'Second',
      'First',
      'Third',
    ]);
  });

  it('sorts quiz by question_order', () => {
    const module = {
      title: { bn: 'Quiz module' },
      cards: [],
      quiz: [
        quizItem('q3', 30, { question: { bn: 'Third' } }),
        quizItem('q1', 10, { question: { bn: 'First' } }),
        quizItem('q2', 20, { question: { bn: 'Second' } }),
      ],
    };

    const snapshot = generateModulePreviewSnapshot(module);

    expect(snapshot.quiz.map((q) => q.question)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
    expect(snapshot.quiz.map((q) => q.index)).toEqual([0, 1, 2]);
  });

  it('uses BN title with EN fallback for cards and module title', () => {
    const module = {
      title: { bn: '  ', en: 'English Module' },
      cards: [card('c1', null, 'English Card')],
      quiz: [],
    };

    const snapshot = generateModulePreviewSnapshot(module);

    expect(snapshot.moduleTitle).toBe('English Module');
    expect(snapshot.cards[0]?.title).toBe('English Card');
  });

  it('returns empty arrays for an empty module', () => {
    const snapshot = generateModulePreviewSnapshot({
      title: {},
      cards: [],
      quiz: [],
    });

    expect(snapshot.moduleTitle).toBe('Untitled module');
    expect(snapshot.cards).toEqual([]);
    expect(snapshot.quiz).toEqual([]);
  });

  it('maps quiz fields with filtered options and clamped correct index', () => {
    const module = {
      title: { bn: 'Module' },
      cards: [],
      quiz: [
        quizItem('q1', 1, {
          question: { bn: '  What?  ' },
          case_setup: { bn: 'Patient presents with fever' },
          options: { bn: ['', 'Correct', '  Wrong  ', ''] },
          correct_indices: [1],
          explanation: { bn: 'Explanation text' },
        }),
      ],
    };

    const snapshot = generateModulePreviewSnapshot(module);
    const item = snapshot.quiz[0];

    expect(item?.question).toBe('What?');
    expect(item?.caseSetup).toBe('Patient presents with fever');
    expect(item?.options).toEqual(['Correct', '  Wrong  ']);
    expect(item?.correctIndex).toBe(0);
    expect(item?.explanation).toBe('Explanation text');
  });

  it('does not allow mutating editor input through the returned snapshot', () => {
    const module = {
      title: { bn: 'Module' },
      cards: [card('c1', 'Original')],
      quiz: [],
    };

    const snapshot = generateModulePreviewSnapshot(module);
    snapshot.cards[0]!.title = 'Mutated';
    snapshot.cards[0]!.body.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Injected' }],
    });

    expect(module.cards[0]?.title.bn).toBe('Original');
    expect(module.cards[0]?.body.bn).toHaveLength(1);
    expect(generateModulePreviewSnapshot(module).cards[0]?.title).toBe(
      'Original',
    );
  });

  it('sets syncedAt to a recent timestamp', () => {
    const before = Date.now();
    const snapshot = generateModulePreviewSnapshot({
      title: { bn: 'Module' },
      cards: [],
      quiz: [],
    });
    const after = Date.now();

    expect(snapshot.syncedAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.syncedAt).toBeLessThanOrEqual(after);
  });
});
