import { describe, expect, it } from 'vitest';
import {
  deadlineStatusToTone,
  moduleStatusToTone,
  overallStatusToTone,
  quizStatusToTone,
} from '@/features/chw-profiles/utils/chwProfilesBadges';

describe('chwProfilesBadges', () => {
  it('maps overall status to badge tone and label', () => {
    expect(overallStatusToTone('on_track').tone).toBe('success');
    expect(overallStatusToTone('flagged').outlined).toBe(true);
    expect(overallStatusToTone('unknown' as 'on_track').tone).toBe('neutral');
  });

  it('maps deadline status to badge tone and label', () => {
    expect(deadlineStatusToTone('due_soon').tone).toBe('warning');
    expect(deadlineStatusToTone('overdue').tone).toBe('critical');
  });

  it('maps module status to badge tone and label', () => {
    expect(moduleStatusToTone('completed').tone).toBe('success');
    expect(moduleStatusToTone('in_progress').tone).toBe('info');
  });

  it('maps quiz status to badge tone and label', () => {
    expect(quizStatusToTone('pass').tone).toBe('success');
    expect(quizStatusToTone('fail').tone).toBe('critical');
  });
});
