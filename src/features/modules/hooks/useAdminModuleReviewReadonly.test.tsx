import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { setCurrentRole, type AppRole } from '@/constants/role';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import {
  adminModuleReviewReducer,
  hydrateFromServer,
} from '@/features/modules/store/adminModuleReviewSlice';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';

function renderReadonlyHook(
  role: AppRole,
  lifecycleStatus: 'draft' | 'published' | 'deactivated',
) {
  setCurrentRole(role);
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
    ['programManager', 'draft', false],
    ['programManager', 'published', true],
    ['programManager', 'deactivated', true],
    ['supervisor', 'draft', true],
  ] as const)(
    'returns %s / %s as readonly=%s',
    (role, lifecycleStatus, expected) => {
      const { result } = renderReadonlyHook(role, lifecycleStatus);

      expect(result.current).toBe(expected);
    },
  );
});
