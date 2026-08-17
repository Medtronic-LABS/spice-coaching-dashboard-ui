import { describe, expect, it } from 'vitest';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import {
  groupAdminModuleDraftIssues,
  shortAdminModuleDraftIssueText,
} from '@/features/modules/utils/groupAdminModuleDraftIssues';

const issues: AdminModuleDraftIssue[] = [
  {
    kind: 'quiz',
    index: 2,
    itemId: 'q3',
    field: 'question',
    message: 'Quiz question 3 needs a question.',
  },
  {
    kind: 'card',
    index: 1,
    itemId: 'c2',
    field: 'title',
    message: 'Card 2 needs a title.',
  },
  {
    kind: 'card',
    index: 1,
    itemId: 'c2',
    field: 'body',
    message: 'Card 2 needs body content.',
  },
  {
    kind: 'quiz',
    index: 2,
    itemId: 'q3',
    field: 'options',
    message: 'Quiz question 3 has blank options (1, 2, 3, 4).',
  },
];

describe('groupAdminModuleDraftIssues', () => {
  it('groups cards before quiz and clusters by item', () => {
    const groups = groupAdminModuleDraftIssues(issues);
    expect(groups.map((group) => group.title)).toEqual(['Cards', 'Quiz']);
    expect(groups[0]?.items).toHaveLength(1);
    expect(groups[0]?.items[0]?.label).toBe('Card 2');
    expect(groups[0]?.items[0]?.issues.map((issue) => issue.field)).toEqual([
      'title',
      'body',
    ]);
    expect(groups[1]?.items[0]?.label).toBe('Quiz question 3');
    expect(groups[1]?.items[0]?.issues.map((issue) => issue.field)).toEqual([
      'question',
      'options',
    ]);
  });

  it('shortens issue text under a group label', () => {
    expect(shortAdminModuleDraftIssueText(issues[1]!, 'Card 2')).toBe(
      'Needs a title.',
    );
    expect(shortAdminModuleDraftIssueText(issues[3]!, 'Quiz question 3')).toBe(
      'Has blank options (1, 2, 3, 4).',
    );
  });
});
