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

  it('maps lifecycle statuses to labels', () => {
    expect(getModuleStatusBadgeProps('draft').label).toBe('Draft');
    expect(getModuleStatusBadgeProps('published').label).toBe('Published');
    expect(getModuleStatusBadgeProps('review_pending').label).toBe('Review');
    expect(getModuleStatusBadgeProps('discarded').label).toBe('Discarded');
    expect(getModuleStatusBadgeProps('deactivated').label).toBe('Deactivated');
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
