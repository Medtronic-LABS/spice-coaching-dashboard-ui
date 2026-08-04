import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';

describe('SettingsFilterRenderer', () => {
  it('renders checkbox options and forwards Apply / Clear All', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClearAll = vi.fn();
    const onToggle = vi.fn();

    const sections: SettingsFilterSection[] = [
      {
        id: 'status',
        label: 'Status',
        fields: [
          {
            type: 'checkbox-group',
            id: 'status-options',
            label: 'Status',
            description: 'Pick statuses to filter the table.',
            values: ['failed'],
            options: [
              { label: 'Failed', value: 'failed' },
              { label: 'Ingested', value: 'ingested' },
            ],
            onToggle,
          },
        ],
      },
    ];

    render(
      <SettingsFilterRenderer
        sections={sections}
        onClearAll={onClearAll}
        onApply={onApply}
      />,
    );

    expect(
      screen.getByText('Pick statuses to filter the table.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Failed')).toBeChecked();
    expect(screen.getByLabelText('Ingested')).not.toBeChecked();

    await user.click(screen.getByLabelText('Ingested'));
    expect(onToggle).toHaveBeenCalledWith('ingested');

    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(onClearAll).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('shows date-range validation and disables Apply when requested', () => {
    const onApply = vi.fn();

    render(
      <SettingsFilterRenderer
        sections={[
          {
            id: 'dates',
            label: 'Date ranges',
            fields: [
              {
                type: 'date-range',
                id: 'created',
                label: 'Created',
                from: {
                  id: 'created-from',
                  value: '2026-04-30',
                  ariaLabel: 'Created from',
                  onChange: vi.fn(),
                },
                to: {
                  id: 'created-to',
                  value: '2026-04-01',
                  ariaLabel: 'Created to',
                  onChange: vi.fn(),
                },
                invalid: true,
                errorMessage: 'From date must be on or before to date.',
              },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onApply={onApply}
        applyDisabled
      />,
    );

    expect(screen.getByLabelText('Created from')).toHaveValue('2026-04-30');
    expect(screen.getByLabelText('Created to')).toHaveValue('2026-04-01');
    expect(
      screen.getByText('From date must be on or before to date.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
