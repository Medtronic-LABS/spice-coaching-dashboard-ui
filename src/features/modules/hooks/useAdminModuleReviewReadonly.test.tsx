import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import {
  adminModuleReviewReducer,
  hydrateFromServer,
} from '@/features/modules/store/adminModuleReviewSlice';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';

function renderReadonlyHook(
  lifecycleStatus: 'draft' | 'published' | 'deactivated',
) {
  const store = configureStore({
    reducer: { adminModuleReview: adminModuleReviewReducer },
  });
  store.dispatch(
    hydrateFromServer({
      moduleId: 'mod-1',
      data: baseAdminModuleDetail({ lifecycle_status: lifecycleStatus }),
    }),
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useAdminModuleReviewReadonly(), { wrapper });
}

describe('useAdminModuleReviewReadonly', () => {
  it.each([
    ['draft', false],
    ['published', true],
    ['deactivated', true],
  ] as const)('returns %s as readonly=%s', (lifecycleStatus, expected) => {
    const { result } = renderReadonlyHook(lifecycleStatus);

    expect(result.current).toBe(expected);
  });
});
