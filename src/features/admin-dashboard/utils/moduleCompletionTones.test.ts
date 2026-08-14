import { describe, expect, it } from 'vitest';
import {
  MODULE_COMPLETION_ROW_TONES,
  resolveModuleCompletionTone,
} from '@/features/admin-dashboard/utils/moduleCompletionTones';

describe('resolveModuleCompletionTone', () => {
  it('cycles through the configured tone palette', () => {
    expect(resolveModuleCompletionTone(0)).toBe(MODULE_COMPLETION_ROW_TONES[0]);
    expect(resolveModuleCompletionTone(3)).toBe(MODULE_COMPLETION_ROW_TONES[3]);
    expect(resolveModuleCompletionTone(4)).toBe(MODULE_COMPLETION_ROW_TONES[0]);
  });
});
