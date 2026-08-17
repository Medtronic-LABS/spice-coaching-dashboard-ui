import { describe, expect, it } from 'vitest';
import {
  MODULE_COMPLETION_TONES,
  resolveModuleCompletionTone,
} from '@/features/admin-dashboard/utils/moduleCompletionTones';

describe('resolveModuleCompletionTone', () => {
  it('uses green for on-track completion, blue for mid-range, red below', () => {
    expect(resolveModuleCompletionTone(75)).toBe(
      MODULE_COMPLETION_TONES.onTrack,
    );
    expect(resolveModuleCompletionTone(55)).toBe(MODULE_COMPLETION_TONES.watch);
    expect(resolveModuleCompletionTone(54.9)).toBe(
      MODULE_COMPLETION_TONES.atRisk,
    );
  });
});
