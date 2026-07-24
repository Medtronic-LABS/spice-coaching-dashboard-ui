import { describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { applyModuleVersionConflictReload } from '@/features/modules/utils/applyModuleVersionConflictReload';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';

describe('applyModuleVersionConflictReload', () => {
  it('calls onLoaded with tip detail and navigates when tip id differs', async () => {
    const tip = baseAdminModuleDetail({
      id: 'mod-tip',
      version: 2,
      title: { bn: 'Tip Title' },
      cards: [emptyCard('c1', 'Tip Card')],
    });
    const navigate = vi.fn();
    const onLoaded = vi.fn();
    const refetchModule = vi.fn().mockResolvedValue({ data: tip });

    const ok = await applyModuleVersionConflictReload({
      tipId: 'mod-tip',
      currentModuleId: 'mod-1',
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      navigate,
      refetchModule,
      onLoaded,
    });

    expect(ok).toBe(true);
    expect(refetchModule).toHaveBeenCalledWith('mod-tip');
    expect(onLoaded).toHaveBeenCalledWith(tip);
    expect(navigate).toHaveBeenCalledWith(
      paths.adminModuleReviewDetails.replace(':moduleId', 'mod-tip'),
      { replace: true },
    );
  });

  it('does not navigate when tip id matches current module', async () => {
    const tip = baseAdminModuleDetail({ id: 'mod-1', version: 2 });
    const navigate = vi.fn();
    const onLoaded = vi.fn();

    await applyModuleVersionConflictReload({
      tipId: 'mod-1',
      currentModuleId: 'mod-1',
      pathname: paths.adminModuleReviewLessons.replace(':moduleId', 'mod-1'),
      navigate,
      refetchModule: vi.fn().mockResolvedValue({ data: tip }),
      onLoaded,
    });

    expect(onLoaded).toHaveBeenCalledWith(tip);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns false when refetch has no data', async () => {
    const navigate = vi.fn();
    const onLoaded = vi.fn();

    const ok = await applyModuleVersionConflictReload({
      tipId: 'mod-tip',
      currentModuleId: 'mod-1',
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      navigate,
      refetchModule: vi.fn().mockResolvedValue(undefined),
      onLoaded,
    });

    expect(ok).toBe(false);
    expect(onLoaded).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
