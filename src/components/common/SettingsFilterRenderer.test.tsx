import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { todayDateInputValue } from '@/utils/dateInput';

describe('SettingsFilterRenderer', () => {
  it('renders segmented options and forwards selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SettingsFilterRenderer
        sections={[
          {
            id: 'general',
            label: 'General',
            fields: [
              {
                type: 'segmented',
                id: 'assigned',
                label: 'Assigned',
                value: 'all',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ],
                onChange,
              },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByText('Assigned')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Yes' }));
    expect(onChange).toHaveBeenCalledWith('yes');
  });

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

  it('caps From and To date pickers at today', () => {
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
                  value: '2026-04-01',
                  ariaLabel: 'Created from',
                  onChange: vi.fn(),
                },
                to: {
                  id: 'created-to',
                  value: '2026-04-10',
                  ariaLabel: 'Created to',
                  onChange: vi.fn(),
                },
              },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    const today = todayDateInputValue();
    expect(screen.getByLabelText('Created from')).toHaveAttribute('max', today);
    expect(screen.getByLabelText('Created to')).toHaveAttribute('max', today);
  });

  it('applies fieldsClassName to date-range field wrappers', () => {
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
                  value: '2026-04-01',
                  ariaLabel: 'Created from',
                  onChange: vi.fn(),
                },
                to: {
                  id: 'created-to',
                  value: '2026-04-10',
                  ariaLabel: 'Created to',
                  onChange: vi.fn(),
                },
              },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText('Created from').closest('div.pl-2'),
    ).toBeNull();

    render(
      <SettingsFilterRenderer
        sections={[
          {
            id: 'dates',
            label: 'Date ranges',
            fieldsClassName: 'pl-2',
            fields: [
              {
                type: 'date-range',
                id: 'padded',
                label: 'Padded',
                from: {
                  id: 'padded-from',
                  value: '2026-04-01',
                  ariaLabel: 'Padded from',
                  onChange: vi.fn(),
                },
                to: {
                  id: 'padded-to',
                  value: '2026-04-10',
                  ariaLabel: 'Padded to',
                  onChange: vi.fn(),
                },
              },
            ],
          },
        ]}
        onClearAll={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText('Padded from').closest('div.pl-2'),
    ).not.toBeNull();
  });
});
