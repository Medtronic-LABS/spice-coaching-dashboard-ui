import { buildPath, paths } from '@/constants/routes';
import {
  navigateToAdminModuleDraftIssue,
  pathForAdminModuleDraftIssue,
} from '@/features/modules/utils/adminModuleDraftIssueNavigation';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import { describe, expect, it, vi } from 'vitest';

const cardIssue: AdminModuleDraftIssue = {
  kind: 'card',
  index: 1,
  itemId: 'c2',
  field: 'title',
  message: 'Card 2 needs a title.',
};

const quizIssue: AdminModuleDraftIssue = {
  kind: 'quiz',
  index: 0,
  itemId: 'q1',
  field: 'question',
  message: 'Quiz question 1 needs a question.',
};

describe('pathForAdminModuleDraftIssue', () => {
  it('routes card issues to lessons and quiz issues to quiz', () => {
    expect(pathForAdminModuleDraftIssue('mod-1', cardIssue)).toBe(
      buildPath(paths.adminModuleReviewLessons, { moduleId: 'mod-1' }),
    );
    expect(pathForAdminModuleDraftIssue('mod-1', quizIssue)).toBe(
      buildPath(paths.adminModuleReviewQuiz, { moduleId: 'mod-1' }),
    );
  });
});

describe('navigateToAdminModuleDraftIssue', () => {
  it('closes feedback then navigates with focus state', () => {
    const navigate = vi.fn();
    const onBeforeNavigate = vi.fn();

    navigateToAdminModuleDraftIssue({
      navigate,
      moduleId: 'mod-1',
      issue: cardIssue,
      onBeforeNavigate,
    });

    expect(onBeforeNavigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      buildPath(paths.adminModuleReviewLessons, { moduleId: 'mod-1' }),
      { state: { focusDraftIssue: cardIssue } },
    );
  });
});
