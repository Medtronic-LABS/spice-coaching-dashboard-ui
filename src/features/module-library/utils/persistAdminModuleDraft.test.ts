import { describe, expect, it, vi } from 'vitest';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import { paths } from '@/constants/routes';
import { persistAdminModuleDraft } from '@/features/module-library/utils/persistAdminModuleDraft';

const working: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title: { bn: 'Title BN', en: 'Title EN' },
  description: { bn: 'Desc BN', en: 'Desc EN' },
  domain: 'rmnch',
  module_type: 'refresher',
  lifecycle_status: 'draft',
  clinically_reviewed: false,
  has_visibility_window: false,
  card_count: 1,
  estimated_minutes: 5,
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  quality_flags: null,
  module_json: {
    cards: [{ id: 'c1', title: { bn: 'Card' }, body: { bn: [] } }],
    quiz: [],
  },
  cards: [{ id: 'c1', title: { bn: 'Card' }, body: { bn: [] } }],
  quiz: [],
};

describe('persistAdminModuleDraft', () => {
  it('persists draft and calls onSaved with refetched module data', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-1',
        module_family_id: 'family-1',
        version: 1,
        supersedes_module_id: 'mod-0',
      }),
    }));
    const navigate = vi.fn();
    const refetched: AdminModuleDetailResponse = {
      ...working,
      title: { bn: 'Saved BN', en: 'Title EN' },
    };
    const refetchModule = vi.fn().mockResolvedValue({ data: refetched });
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetchModule,
      onSaved,
    });

    expect(editModule).toHaveBeenCalledWith({
      moduleId: 'mod-1',
      body: expect.objectContaining({
        title: { bn: 'Title BN', en: 'Title EN' },
        module_json: expect.objectContaining({
          cards: expect.arrayContaining([
            expect.objectContaining({ title: { bn: 'Card' } }),
          ]),
          quiz: [],
        }),
      }),
    });
    expect(refetchModule).toHaveBeenCalledWith('mod-1');
    expect(onSaved).toHaveBeenCalledWith(refetched);
  });

  it('syncs the new module id before refetch when save supersedes the draft', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-2',
        module_family_id: 'family-1',
        version: 2,
        supersedes_module_id: 'mod-1',
      }),
    }));
    const navigate = vi.fn();
    const refetchModule = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetchModule,
      onSaved,
    });

    expect(onSaved).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'mod-2', version: 2 }),
    );
    expect(refetchModule).toHaveBeenCalledWith('mod-2');
    expect(navigate).toHaveBeenCalledWith(
      paths.adminModuleReviewDetails.replace(':moduleId', 'mod-2'),
      { replace: true },
    );
  });

  it('falls back to local working copy when refetch has no data', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-1',
        module_family_id: 'family-1',
        version: 1,
        supersedes_module_id: 'mod-0',
      }),
    }));
    const navigate = vi.fn();
    const refetchModule = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetchModule,
      onSaved,
    });

    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mod-1',
        module_json: { cards: working.cards, quiz: [] },
      }),
    );
  });
});
