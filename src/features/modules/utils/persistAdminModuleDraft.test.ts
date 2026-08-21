import { describe, expect, it, vi } from 'vitest';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { paths } from '@/constants/routes';
import type { AdminModuleDetailResponse } from '@/features/modules/api/adminModulesApi';
import { persistAdminModuleDraft } from '@/features/modules/utils/persistAdminModuleDraft';
import { AdminModuleDraftValidationError } from '@/features/modules/utils/validateAdminModuleDraftContent';

const filledCardBody = [
  {
    type: 'paragraph' as const,
    content: [{ type: 'text' as const, text: 'Card body' }],
  },
];

const working: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title: { bn: 'Title BN', en: 'Title EN' },
  description: { bn: 'Desc BN', en: 'Desc EN' },
  domain: 'rmnch',
  content_domain: 'clinical',
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
    cards: [{ id: 'c1', title: { bn: 'Card' }, body: { bn: filledCardBody } }],
    quiz: [],
  },
  cards: [{ id: 'c1', title: { bn: 'Card' }, body: { bn: filledCardBody } }],
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

    const saved = await persistAdminModuleDraft({
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
        expected_version: 1,
        title: { bn: 'Title BN', en: 'Title EN' },
        chatbot_faqs_only: false,
        domain: 'rmnch',
        content_domain: 'clinical',
        estimated_minutes: 5,
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
    expect(saved).toEqual(refetched);
  });

  it('persists chatbot_faqs_only when enabled on the working draft', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-1',
        module_family_id: 'family-1',
        version: 2,
        supersedes_module_id: 'mod-1',
      }),
    }));
    const navigate = vi.fn();
    const refetchModule = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();

    await persistAdminModuleDraft({
      working: { ...working, chatbot_faqs_only: true },
      editModule,
      navigate,
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetchModule,
      onSaved,
    });

    expect(editModule).toHaveBeenCalledWith({
      moduleId: 'mod-1',
      body: expect.objectContaining({
        chatbot_faqs_only: true,
      }),
    });
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

    const saved = await persistAdminModuleDraft({
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
    expect(saved.id).toBe('mod-2');
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

    const saved = await persistAdminModuleDraft({
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
    expect(saved).toEqual(
      expect.objectContaining({
        id: 'mod-1',
        module_json: { cards: working.cards, quiz: [] },
      }),
    );
  });

  it('rejects blank cards before calling the edit API', async () => {
    const editModule = vi.fn();
    await expect(
      persistAdminModuleDraft({
        working: {
          ...working,
          cards: [{ id: 'c1', title: { bn: '' }, body: { bn: [] } }],
        },
        editModule,
        navigate: vi.fn(),
        pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
        refetchModule: vi.fn(),
        onSaved: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(AdminModuleDraftValidationError);
    expect(editModule).not.toHaveBeenCalled();
  });

  it('defaults missing content_domain to clinical on save', async () => {
    const editModule = vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        id: 'mod-1',
        module_family_id: 'family-1',
        version: 1,
        supersedes_module_id: 'mod-0',
      }),
    }));

    await persistAdminModuleDraft({
      working: { ...working, content_domain: null },
      editModule,
      navigate: vi.fn(),
      pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
      refetchModule: vi.fn().mockResolvedValue(undefined),
      onSaved: vi.fn(),
    });

    expect(editModule).toHaveBeenCalledWith({
      moduleId: 'mod-1',
      body: expect.objectContaining({
        content_domain: 'clinical',
      }),
    });
  });

  it('rejects a blank domain before calling the edit API', async () => {
    const editModule = vi.fn();
    await expect(
      persistAdminModuleDraft({
        working: { ...working, domain: '   ' },
        editModule,
        navigate: vi.fn(),
        pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
        refetchModule: vi.fn(),
        onSaved: vi.fn(),
      }),
    ).rejects.toThrow('Domain is required.');
    expect(editModule).not.toHaveBeenCalled();
  });

  it('rejects a domain over the taxonomy limit before calling the edit API', async () => {
    const editModule = vi.fn();
    await expect(
      persistAdminModuleDraft({
        working: {
          ...working,
          domain: 'd'.repeat(FIELD_LIMITS.taxonomy + 1),
        },
        editModule,
        navigate: vi.fn(),
        pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
        refetchModule: vi.fn(),
        onSaved: vi.fn(),
      }),
    ).rejects.toThrow('Domain must be 80 characters or fewer.');
    expect(editModule).not.toHaveBeenCalled();
  });

  it('rejects invalid estimated minutes before calling the edit API', async () => {
    const editModule = vi.fn();
    await expect(
      persistAdminModuleDraft({
        working: { ...working, estimated_minutes: 0 },
        editModule,
        navigate: vi.fn(),
        pathname: paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
        refetchModule: vi.fn(),
        onSaved: vi.fn(),
      }),
    ).rejects.toThrow('Estimated minutes are required.');
    expect(editModule).not.toHaveBeenCalled();
  });
});
