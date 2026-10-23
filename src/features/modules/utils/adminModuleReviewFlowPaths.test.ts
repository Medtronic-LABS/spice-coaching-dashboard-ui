import { describe, expect, it } from 'vitest';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
import { isAdminModuleReviewFlowPath } from '@/features/modules/utils/adminModuleReviewFlowPaths';

describe('isAdminModuleReviewFlowPath', () => {
  it('matches admin module review step routes', () => {
    expect(
      isAdminModuleReviewFlowPath(adminModuleReviewPaths.details('mod-1')),
    ).toBe(true);
    expect(
      isAdminModuleReviewFlowPath(adminModuleReviewPaths.publish('mod-1')),
    ).toBe(true);
  });

  it('rejects routes outside the review flow', () => {
    expect(isAdminModuleReviewFlowPath(paths.moduleLibrary)).toBe(false);
    expect(isAdminModuleReviewFlowPath(paths.moduleAssigned)).toBe(false);
  });
});
