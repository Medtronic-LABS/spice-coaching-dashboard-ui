import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardFilterBar } from '@/features/admin-dashboard/components/DashboardFilterBar';
import {
  DEFAULT_DASHBOARD_FILTERS,
  EMPTY_DASHBOARD_GEOGRAPHY,
} from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type {
  DashboardFiltersState,
  DashboardGeographyFilters,
} from '@/features/admin-dashboard/types/dashboard.types';
import { todayDateInputValue } from '@/utils/dateInput';

vi.mock('@/features/modules/api/adminAssignmentApi', () => ({
  useFetchAdminDistrictsQuery: () => ({
    data: [
      { id: 10, name: 'Gazipur', division_id: 1 },
      { id: 11, name: 'Kishoreganj', division_id: 1 },
      { id: 20, name: 'Lalmonirhat', division_id: 2 },
    ],
  }),
  useFetchAdminDivisionsQuery: () => ({
    data: [
      { id: 1, name: 'Dhaka' },
      { id: 2, name: 'Rangpur' },
    ],
  }),
  useFetchAdminUpazilasQuery: () => ({
    data: [
      { id: 100, name: 'Kaliakoir', district_id: 10 },
      { id: 110, name: 'Bhairab', district_id: 11 },
      { id: 200, name: 'Hatibandha', district_id: 20 },
    ],
  }),
}));

function renderFilterBar(
  extra: {
    filters?: DashboardFiltersState;
    onGeographyChange?: (geography: DashboardGeographyFilters) => void;
  } = {},
) {
  return render(
    <DashboardFilterBar
      filters={{
        ...DEFAULT_DASHBOARD_FILTERS,
        geography: EMPTY_DASHBOARD_GEOGRAPHY,
      }}
      onDurationChange={vi.fn()}
      onCustomFromChange={vi.fn()}
      onCustomToChange={vi.fn()}
      onGeographyChange={vi.fn()}
      {...extra}
    />,
  );
}

async function openFiltersPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Filters' }));
  return screen.getByRole('dialog', { name: 'Dashboard filters' });
}

describe('DashboardFilterBar', () => {
  it('caps custom From and To date pickers at today', () => {
    renderFilterBar({
      filters: {
        ...DEFAULT_DASHBOARD_FILTERS,
        durationPreset: 'custom',
        customFrom: '2026-04-01',
        customTo: '2026-04-10',
        geography: EMPTY_DASHBOARD_GEOGRAPHY,
      },
    });

    const today = todayDateInputValue();
    expect(screen.getByLabelText('From')).toHaveAttribute('max', today);
    expect(screen.getByLabelText('To')).toHaveAttribute('max', today);
  });

  it('shows upazila options when the filters panel opens', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    const upazilaSelect = within(panel).getByLabelText('Upazila');

    expect(
      within(upazilaSelect).getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(
      within(upazilaSelect).getByRole('option', { name: 'Bhairab' }),
    ).toBeInTheDocument();
    expect(
      within(upazilaSelect).getByRole('option', { name: 'Hatibandha' }),
    ).toBeInTheDocument();
    expect(within(panel).queryByText('Team view')).not.toBeInTheDocument();
    expect(within(panel).queryByText('All statuses')).not.toBeInTheDocument();
  });

  it('applies division, district, and upazila as hierarchy ids', async () => {
    const user = userEvent.setup();
    const onGeographyChange = vi.fn();
    renderFilterBar({ onGeographyChange });

    const panel = await openFiltersPanel(user);
    await user.selectOptions(within(panel).getByLabelText('Division'), '1');
    await user.selectOptions(within(panel).getByLabelText('District'), '10');
    await user.selectOptions(within(panel).getByLabelText('Upazila'), '100');
    await user.click(within(panel).getByRole('button', { name: 'Apply' }));

    expect(onGeographyChange).toHaveBeenCalledWith({
      divisionId: '1',
      districtId: '10',
      upazilaId: '100',
    });
  });

  it('narrows districts to the selected division and upazilas to the selected district', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await user.selectOptions(within(panel).getByLabelText('Division'), '1');

    const districtSelect = within(panel).getByLabelText('District');
    expect(
      within(districtSelect).getByRole('option', { name: 'Gazipur' }),
    ).toBeInTheDocument();
    expect(
      within(districtSelect).getByRole('option', { name: 'Kishoreganj' }),
    ).toBeInTheDocument();
    expect(
      within(districtSelect).queryByRole('option', { name: 'Lalmonirhat' }),
    ).not.toBeInTheDocument();

    const upazilaSelect = within(panel).getByLabelText('Upazila');
    expect(
      within(upazilaSelect).getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(
      within(upazilaSelect).getByRole('option', { name: 'Bhairab' }),
    ).toBeInTheDocument();
    expect(
      within(upazilaSelect).queryByRole('option', { name: 'Hatibandha' }),
    ).not.toBeInTheDocument();

    await user.selectOptions(districtSelect, '10');
    expect(
      within(upazilaSelect).getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(
      within(upazilaSelect).queryByRole('option', { name: 'Bhairab' }),
    ).not.toBeInTheDocument();
    expect(
      within(upazilaSelect).queryByRole('option', { name: 'Hatibandha' }),
    ).not.toBeInTheDocument();
  });

  it('clears district and upazila when the division changes', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await user.selectOptions(within(panel).getByLabelText('Division'), '2');
    await user.selectOptions(within(panel).getByLabelText('District'), '20');
    await user.selectOptions(within(panel).getByLabelText('Upazila'), '200');

    await user.selectOptions(within(panel).getByLabelText('Division'), '1');

    expect(within(panel).getByLabelText('District')).toHaveValue('');
    expect(within(panel).getByLabelText('Upazila')).toHaveValue('');
  });

  it('clears upazila when the district changes', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await user.selectOptions(within(panel).getByLabelText('District'), '20');
    await user.selectOptions(within(panel).getByLabelText('Upazila'), '200');

    await user.selectOptions(within(panel).getByLabelText('District'), '10');

    expect(within(panel).getByLabelText('Upazila')).toHaveValue('');
  });

  it('clears draft geography when Clear all filters is clicked', async () => {
    const user = userEvent.setup();
    const onGeographyChange = vi.fn();
    renderFilterBar({ onGeographyChange });

    const panel = await openFiltersPanel(user);
    await user.selectOptions(within(panel).getByLabelText('Division'), '1');
    await user.selectOptions(within(panel).getByLabelText('District'), '10');
    await user.click(
      within(panel).getByRole('button', { name: 'Clear all filters' }),
    );

    expect(within(panel).getByLabelText('Division')).toHaveValue('');
    expect(within(panel).getByLabelText('District')).toHaveValue('');
    expect(within(panel).getByLabelText('Upazila')).toHaveValue('');

    await user.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onGeographyChange).toHaveBeenCalledWith(EMPTY_DASHBOARD_GEOGRAPHY);
  });
});
