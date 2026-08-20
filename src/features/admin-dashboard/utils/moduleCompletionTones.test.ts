import { describe, expect, it } from 'vitest';
import {
  MODULE_COMPLETION_TONES,
  resolveModuleCompletionTone,
} from '@/features/admin-dashboard/utils/moduleCompletionTones';

describe('resolveModuleCompletionTone', () => {
  it('uses green for >75%, blue for 51-75%, orange for 26-50%, red for 0-25%', () => {
    expect(resolveModuleCompletionTone(100)).toBe(
      MODULE_COMPLETION_TONES.onTrack,
    );
    expect(resolveModuleCompletionTone(76)).toBe(
      MODULE_COMPLETION_TONES.onTrack,
    );
    expect(resolveModuleCompletionTone(75)).toBe(MODULE_COMPLETION_TONES.watch);
    expect(resolveModuleCompletionTone(51)).toBe(MODULE_COMPLETION_TONES.watch);
    expect(resolveModuleCompletionTone(50)).toBe(MODULE_COMPLETION_TONES.fair);
    expect(resolveModuleCompletionTone(26)).toBe(MODULE_COMPLETION_TONES.fair);
    expect(resolveModuleCompletionTone(25)).toBe(
      MODULE_COMPLETION_TONES.atRisk,
    );
    expect(resolveModuleCompletionTone(0)).toBe(MODULE_COMPLETION_TONES.atRisk);
  });
});
