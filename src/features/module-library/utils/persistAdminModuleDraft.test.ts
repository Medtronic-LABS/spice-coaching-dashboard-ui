import { describe, expect, it, vi } from 'vitest';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import { paths } from '@/constants/routes';
import { persistAdminModuleDraft } from '@/features/module-library/utils/persistAdminModuleDraft';

const working: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title_bn: 'Title BN',
  title_en: 'Title EN',
  description_bn: 'Desc BN',
  description_en: 'Desc EN',
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
    cards: [{ id: 'c1', title_bn: 'Card', body_bn: null }],
    quiz: [],
  },
  cards: [{ id: 'c1', title_bn: 'Card', body_bn: null }],
  quiz: [],
};

describe('persistAdminModuleDraft', () => {
  it('persists draft and calls onSaved with refetched module data', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({ id: 'mod-1' }),
    }));
    const navigate = vi.fn();
    const refetched: AdminModuleDetailResponse = {
      ...working,
      title_bn: 'Saved BN',
    };
    const refetch = vi.fn().mockResolvedValue({ data: refetched });
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetch,
      onSaved,
    });

    expect(editModule).toHaveBeenCalledWith({
      moduleId: 'mod-1',
      body: expect.objectContaining({
        title_bn: 'Title BN',
        module_json: { cards: working.cards, quiz: [] },
      }),
    });
    expect(onSaved).toHaveBeenCalledWith(refetched);
  });

  it('falls back to local working copy when refetch has no data', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({ id: 'mod-1' }),
    }));
    const navigate = vi.fn();
    const refetch = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working,
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetch,
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
