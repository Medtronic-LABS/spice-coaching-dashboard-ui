import { describe, expect, it, vi } from 'vitest';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
import {
  applyEditModuleAndSyncRoute,
  buildAdminModuleReviewPath,
} from '@/features/modules/utils/applyEditModuleAndSyncRoute';

describe('buildAdminModuleReviewPath', () => {
  it('replaces module id while preserving review step suffix', () => {
    const current = adminModuleReviewPaths.lessons('old-id');
    const next = buildAdminModuleReviewPath(current, 'new-id');
    expect(next).toBe(adminModuleReviewPaths.lessons('new-id'));
  });

  it('returns null outside admin module review routes', () => {
    expect(buildAdminModuleReviewPath(paths.moduleLibrary, 'mod-1')).toBeNull();
  });
});

describe('applyEditModuleAndSyncRoute', () => {
  it('returns the edit response when module id is unchanged', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({ id: 'mod-1' }),
    }));
    const navigate = vi.fn();

    const response = await applyEditModuleAndSyncRoute({
      editModule,
      navigate,
      pathname: adminModuleReviewPaths.details('mod-1'),
      moduleEntityId: 'mod-1',
      body: {
        expected_version: 1,
        title: { bn: 'Updated' },
        module_json: { cards: [] },
      },
    });

    expect(response.id).toBe('mod-1');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to updated module path when save returns a new id', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-2',
        module_family_id: 'family-1',
        version: 2,
        supersedes_module_id: 'mod-1',
      }),
    }));
    const navigate = vi.fn();

    await applyEditModuleAndSyncRoute({
      editModule,
      navigate,
      pathname: adminModuleReviewPaths.quiz('mod-1'),
      moduleEntityId: 'mod-1',
      body: {
        expected_version: 1,
        title: { bn: 'Updated' },
        module_json: { cards: [] },
      },
    });

    expect(navigate).toHaveBeenCalledWith(
      adminModuleReviewPaths.quiz('mod-2'),
      { replace: true },
    );
  });
});
