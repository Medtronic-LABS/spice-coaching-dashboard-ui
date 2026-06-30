import { describe, expect, it } from 'vitest';
import { store } from '@/store/store';

describe('store', () => {
  it('registers RTK Query and feature reducers', () => {
    const state = store.getState();
    expect(state.baseApi).toBeDefined();
    expect(state.adminModuleReview).toBeDefined();
    expect(state.courseModuleEdit).toBeDefined();
  });
});
