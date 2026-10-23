import { describe, expect, it } from 'vitest';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import {
  adminModuleReviewReducer,
  editableSnapshot,
  hydrateFromServer,
  updateDetails,
} from './adminModuleReviewSlice';

describe('editableSnapshot', () => {
  it('treats domain, domain type, and estimated minutes as editable fields', () => {
    const baseline = baseAdminModuleDetail();

    expect(editableSnapshot({ ...baseline, domain: 'ncd' })).not.toBe(
      editableSnapshot(baseline),
    );
    expect(
      editableSnapshot({ ...baseline, content_domain: 'digital' }),
    ).not.toBe(editableSnapshot(baseline));
    expect(editableSnapshot({ ...baseline, estimated_minutes: 20 })).not.toBe(
      editableSnapshot(baseline),
    );
    expect(editableSnapshot({ ...baseline, content_domain: null })).not.toBe(
      editableSnapshot(baseline),
    );
  });
});

describe('hydrateFromServer', () => {
  it('keeps unsaved domain metadata when the draft is already dirty', () => {
    const baseline = baseAdminModuleDetail({
      domain: 'rmnch',
      content_domain: 'clinical',
      estimated_minutes: 5,
    });
    let state = adminModuleReviewReducer(
      undefined,
      hydrateFromServer({ moduleId: baseline.id, data: baseline }),
    );
    state = adminModuleReviewReducer(
      state,
      updateDetails({
        domain: 'ncd',
        content_domain: 'digital',
        estimated_minutes: 25,
      }),
    );

    state = adminModuleReviewReducer(
      state,
      hydrateFromServer({
        moduleId: baseline.id,
        data: {
          ...baseline,
          title: { bn: 'Server BN', en: 'Module EN' },
          domain: 'rmnch',
          content_domain: 'clinical',
          estimated_minutes: 5,
        },
      }),
    );

    expect(state.working?.domain).toBe('ncd');
    expect(state.working?.content_domain).toBe('digital');
    expect(state.working?.estimated_minutes).toBe(25);
    expect(state.working?.title.bn).toBe('Module BN');
  });
});
