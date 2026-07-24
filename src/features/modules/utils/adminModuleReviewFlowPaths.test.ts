import { describe, expect, it } from 'vitest';
import { paths } from '@/constants/routes';
import { isAdminModuleReviewFlowPath } from '@/features/modules/utils/adminModuleReviewFlowPaths';

describe('isAdminModuleReviewFlowPath', () => {
  it('matches admin module review step routes', () => {
    expect(
      isAdminModuleReviewFlowPath(
        paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      ),
    ).toBe(true);
    expect(
      isAdminModuleReviewFlowPath(
        paths.adminModuleReviewPublish.replace(':moduleId', 'mod-1'),
      ),
    ).toBe(true);
  });

  it('rejects routes outside the review flow', () => {
    expect(isAdminModuleReviewFlowPath(paths.moduleLibrary)).toBe(false);
    expect(isAdminModuleReviewFlowPath(paths.moduleAssigned)).toBe(false);
  });
});
