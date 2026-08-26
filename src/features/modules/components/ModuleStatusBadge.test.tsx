import { render, screen } from '@testing-library/react';
import {
  getModuleStatusBadgeProps,
  MODULE_STATUS_BADGE_CLASSNAME,
  ModuleStatusBadge,
} from './ModuleStatusBadge';

describe('ModuleStatusBadge', () => {
  it.each([
    ['draft', 'Draft'],
    ['published', 'Published'],
    ['review_pending', 'Review'],
    ['deactivated', 'Deactivated'],
    ['discarded', 'Discarded'],
  ] as const)(
    'renders %s with a compact equal-height capsule',
    (status, label) => {
      render(<ModuleStatusBadge status={status} />);
      expect(screen.getByText(label)).toHaveClass(
        ...MODULE_STATUS_BADGE_CLASSNAME.split(' '),
      );
    },
  );

  it('maps lifecycle statuses to labels and tones', () => {
    expect(getModuleStatusBadgeProps('draft')).toEqual({
      semanticStatus: 'neutral',
      label: 'Draft',
    });
    expect(getModuleStatusBadgeProps('published')).toEqual({
      semanticStatus: 'success',
      label: 'Published',
    });
    expect(getModuleStatusBadgeProps('review_pending')).toEqual({
      semanticStatus: 'warning',
      label: 'Review',
    });
    expect(getModuleStatusBadgeProps('discarded')).toEqual({
      semanticStatus: 'info',
      label: 'Discarded',
    });
    expect(getModuleStatusBadgeProps('retired')).toEqual({
      semanticStatus: 'info',
      label: 'Discarded',
    });
    expect(getModuleStatusBadgeProps('deactivated')).toEqual({
      semanticStatus: 'critical',
      label: 'Deactivated',
    });
  });

  it('uses overrideLabel and merges extra className', () => {
    render(
      <ModuleStatusBadge
        status="draft"
        overrideLabel="Custom"
        className="mt-1"
      />,
    );
    expect(screen.getByText('Custom')).toHaveClass(
      ...MODULE_STATUS_BADGE_CLASSNAME.split(' '),
      'mt-1',
    );
  });
});
