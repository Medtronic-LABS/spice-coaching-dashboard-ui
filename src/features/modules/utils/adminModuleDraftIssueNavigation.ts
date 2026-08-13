import { buildPath, paths } from '@/constants/routes';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import type { NavigateFunction } from 'react-router-dom';

export type AdminModuleDraftFocusLocationState = {
  focusDraftIssue?: AdminModuleDraftIssue;
};

export function pathForAdminModuleDraftIssue(
  moduleId: string,
  issue: AdminModuleDraftIssue,
): string {
  const template =
    issue.kind === 'card'
      ? paths.adminModuleReviewLessons
      : paths.adminModuleReviewQuiz;
  return buildPath(template, { moduleId });
}

/** Close validation UI and route to the Lessons/Quiz step for an issue. */
export function navigateToAdminModuleDraftIssue(options: {
  navigate: NavigateFunction;
  moduleId: string;
  issue: AdminModuleDraftIssue;
  onBeforeNavigate?: () => void;
}): void {
  options.onBeforeNavigate?.();
  options.navigate(
    pathForAdminModuleDraftIssue(options.moduleId, options.issue),
    {
      state: {
        focusDraftIssue: options.issue,
      } satisfies AdminModuleDraftFocusLocationState,
    },
  );
}
