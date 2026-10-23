import { describe, expect, it } from 'vitest';
import { getModuleStatusBadgeProps } from '@/features/modules/utils/moduleStatusBadge';

describe('getModuleStatusBadgeProps', () => {
  it('maps module lifecycle statuses to semantic badge props', () => {
    expect(getModuleStatusBadgeProps('draft')).toEqual({
      status: 'neutral',
      label: 'Draft',
    });
    expect(getModuleStatusBadgeProps('published')).toEqual({
      status: 'success',
      label: 'Published',
    });
    expect(getModuleStatusBadgeProps('review_pending')).toEqual({
      status: 'warning',
      label: 'Review',
    });
    expect(getModuleStatusBadgeProps('discarded')).toEqual({
      status: 'info',
      label: 'Discarded',
    });
    expect(getModuleStatusBadgeProps('retired')).toEqual({
      status: 'info',
      label: 'Discarded',
    });
    expect(getModuleStatusBadgeProps('deactivated')).toEqual({
      status: 'critical',
      label: 'Deactivated',
    });
  });
});
