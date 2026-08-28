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

async function chooseSelectOption(
  user: ReturnType<typeof userEvent.setup>,
  panel: HTMLElement,
  fieldLabel: string,
  optionName: string,
) {
  await user.click(within(panel).getByLabelText(fieldLabel));
  await user.click(screen.getByRole('option', { name: optionName }));
}

async function openSelectOptions(
  user: ReturnType<typeof userEvent.setup>,
  panel: HTMLElement,
  fieldLabel: string,
) {
  await user.click(within(panel).getByLabelText(fieldLabel));
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
    await openSelectOptions(user, panel, 'Upazila');

    expect(
      screen.getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bhairab' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Hatibandha' }),
    ).toBeInTheDocument();
    expect(within(panel).queryByText('Team view')).not.toBeInTheDocument();
    expect(within(panel).queryByText('All statuses')).not.toBeInTheDocument();
  });

  it('applies division, district, and upazila as hierarchy ids', async () => {
    const user = userEvent.setup();
    const onGeographyChange = vi.fn();
    renderFilterBar({ onGeographyChange });

    const panel = await openFiltersPanel(user);
    await chooseSelectOption(user, panel, 'Division', 'Dhaka');
    await chooseSelectOption(user, panel, 'District', 'Gazipur');
    await chooseSelectOption(user, panel, 'Upazila', 'Kaliakoir');
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
    await chooseSelectOption(user, panel, 'Division', 'Dhaka');

    await openSelectOptions(user, panel, 'District');
    expect(screen.getByRole('option', { name: 'Gazipur' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Kishoreganj' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Lalmonirhat' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await openSelectOptions(user, panel, 'Upazila');
    expect(
      screen.getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bhairab' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Hatibandha' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await chooseSelectOption(user, panel, 'District', 'Gazipur');
    await openSelectOptions(user, panel, 'Upazila');
    expect(
      screen.getByRole('option', { name: 'Kaliakoir' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Bhairab' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Hatibandha' }),
    ).not.toBeInTheDocument();
  });

  it('clears district and upazila when the division changes', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await chooseSelectOption(user, panel, 'Division', 'Rangpur');
    await chooseSelectOption(user, panel, 'District', 'Lalmonirhat');
    await chooseSelectOption(user, panel, 'Upazila', 'Hatibandha');

    await chooseSelectOption(user, panel, 'Division', 'Dhaka');

    expect(within(panel).getByLabelText('District')).toHaveTextContent(
      'All districts',
    );
    expect(within(panel).getByLabelText('Upazila')).toHaveTextContent(
      'All upazilas',
    );
  });

  it('clears upazila when the district changes', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await chooseSelectOption(user, panel, 'District', 'Lalmonirhat');
    await chooseSelectOption(user, panel, 'Upazila', 'Hatibandha');

    await chooseSelectOption(user, panel, 'District', 'Gazipur');

    expect(within(panel).getByLabelText('Upazila')).toHaveTextContent(
      'All upazilas',
    );
  });

  it('clears draft geography when Clear all filters is clicked', async () => {
    const user = userEvent.setup();
    const onGeographyChange = vi.fn();
    renderFilterBar({ onGeographyChange });

    const panel = await openFiltersPanel(user);
    await chooseSelectOption(user, panel, 'Division', 'Dhaka');
    await chooseSelectOption(user, panel, 'District', 'Gazipur');
    await user.click(
      within(panel).getByRole('button', { name: 'Clear all filters' }),
    );

    expect(within(panel).getByLabelText('Division')).toHaveTextContent(
      'All divisions',
    );
    expect(within(panel).getByLabelText('District')).toHaveTextContent(
      'All districts',
    );
    expect(within(panel).getByLabelText('Upazila')).toHaveTextContent(
      'All upazilas',
    );

    await user.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onGeographyChange).toHaveBeenCalledWith(EMPTY_DASHBOARD_GEOGRAPHY);
  });
});
