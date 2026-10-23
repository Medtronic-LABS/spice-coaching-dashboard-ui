import { describe, expect, it } from 'vitest';
import {
  STATUS_BADGE_CLASSNAME,
  StatusBadge,
  TABLE_STATUS_BADGE_CLASSNAME,
} from '@/components/ui/StatusBadge';
import { render, screen } from '@testing-library/react';

describe('StatusBadge', () => {
  it('applies shared capsule sizing by default', () => {
    render(<StatusBadge status="success" label="Published" />);
    expect(screen.getByText('Published')).toHaveClass(
      ...STATUS_BADGE_CLASSNAME.split(' '),
    );
  });

  it('supports table min-width override', () => {
    render(
      <StatusBadge
        status="info"
        label="Running"
        className={TABLE_STATUS_BADGE_CLASSNAME}
      />,
    );
    expect(screen.getByText('Running')).toHaveClass(
      ...STATUS_BADGE_CLASSNAME.split(' '),
      ...TABLE_STATUS_BADGE_CLASSNAME.split(' '),
    );
  });
});
