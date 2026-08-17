import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  TextLink,
  WidgetSubheading,
} from '@/features/admin-dashboard/components/document-usage/DocumentUsageChrome';

describe('DocumentUsageChrome', () => {
  it('renders WidgetSubheading with optional action', () => {
    render(
      <WidgetSubheading
        title="Top docs"
        action={<button type="button">Go</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Top docs', level: 4 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('invokes TextLink onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TextLink label="View all" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /view all/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
