import { render, screen, waitFor, within } from '@testing-library/react';
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

const MOCK_DIVISIONS = [
  { id: 1, name: 'Dhaka' },
  { id: 2, name: 'Rangpur' },
];

const MOCK_DISTRICTS = [
  { id: 10, name: 'Gazipur', division_id: 1 },
  { id: 11, name: 'Kishoreganj', division_id: 1 },
  { id: 20, name: 'Lalmonirhat', division_id: 2 },
];

const MOCK_UPAZILAS = [
  { id: 100, name: 'Kaliakoir', district_id: 10 },
  { id: 110, name: 'Bhairab', district_id: 11 },
  { id: 200, name: 'Hatibandha', district_id: 20 },
];

function createPageTrigger<T extends { id: number; name: string }>(
  key: 'divisions' | 'districts' | 'upazilas',
  items: T[],
  filter?: (item: T, args: Record<string, unknown>) => boolean,
) {
  return vi.fn((args: Record<string, unknown> = {}) => {
    const offset = typeof args.offset === 'number' ? args.offset : 0;
    const limit = typeof args.limit === 'number' ? args.limit : 200;
    const filtered = filter
      ? items.filter((item) => filter(item, args))
      : items;
    const pageItems = filtered.slice(offset, offset + limit);
    return Promise.resolve({
      data: {
        [key]: pageItems,
        total: filtered.length,
        offset,
        limit,
      },
    });
  });
}

const triggerDivisionsPage = createPageTrigger('divisions', MOCK_DIVISIONS);
const triggerDistrictsPage = createPageTrigger(
  'districts',
  MOCK_DISTRICTS,
  (district, args) => {
    if (typeof args.divisionId === 'number') {
      return district.division_id === args.divisionId;
    }
    return true;
  },
);
const triggerUpazilasPage = createPageTrigger(
  'upazilas',
  MOCK_UPAZILAS,
  (upazila, args) => {
    if (typeof args.districtId === 'number') {
      return upazila.district_id === args.districtId;
    }
    return true;
  },
);

vi.mock('@/features/modules/api/adminAssignmentApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminAssignmentApi')
    >();
  return {
    ...actual,
    useLazyFetchAdminDivisionsPageQuery: () => [
      triggerDivisionsPage,
      { isLoading: false, isError: false, isFetching: false },
    ],
    useLazyFetchAdminDistrictsPageQuery: () => [
      triggerDistrictsPage,
      { isLoading: false, isError: false, isFetching: false },
    ],
    useLazyFetchAdminUpazilasPageQuery: () => [
      triggerUpazilasPage,
      { isLoading: false, isError: false, isFetching: false },
    ],
  };
});

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

async function chooseComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  panel: HTMLElement,
  fieldLabel: string,
  optionName: string,
) {
  const combobox = within(panel).getByRole('combobox', { name: fieldLabel });
  await user.click(combobox);
  await waitFor(() => {
    expect(
      screen.getByRole('option', { name: optionName }),
    ).toBeInTheDocument();
  });
  await user.click(screen.getByRole('option', { name: optionName }));
}

async function openComboboxOptions(
  user: ReturnType<typeof userEvent.setup>,
  panel: HTMLElement,
  fieldLabel: string,
) {
  const combobox = within(panel).getByRole('combobox', { name: fieldLabel });
  await user.click(combobox);
  await waitFor(() => {
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });
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
    await openComboboxOptions(user, panel, 'Upazila');

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Kaliakoir' }),
      ).toBeInTheDocument();
    });
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
    await chooseComboboxOption(user, panel, 'Division', 'Dhaka');
    await chooseComboboxOption(user, panel, 'District', 'Gazipur');
    await chooseComboboxOption(user, panel, 'Upazila', 'Kaliakoir');
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
    await chooseComboboxOption(user, panel, 'Division', 'Dhaka');

    await openComboboxOptions(user, panel, 'District');
    expect(screen.getByRole('option', { name: 'Gazipur' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Kishoreganj' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Lalmonirhat' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await openComboboxOptions(user, panel, 'Upazila');
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Kaliakoir' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'Bhairab' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Hatibandha' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await chooseComboboxOption(user, panel, 'District', 'Gazipur');
    await openComboboxOptions(user, panel, 'Upazila');
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
    await chooseComboboxOption(user, panel, 'Division', 'Rangpur');
    await chooseComboboxOption(user, panel, 'District', 'Lalmonirhat');
    await chooseComboboxOption(user, panel, 'Upazila', 'Hatibandha');

    await chooseComboboxOption(user, panel, 'Division', 'Dhaka');

    expect(
      within(panel).getByRole('combobox', { name: 'District' }),
    ).toHaveValue('All districts');
    expect(
      within(panel).getByRole('combobox', { name: 'Upazila' }),
    ).toHaveValue('All upazilas');
  });

  it('clears upazila when the district changes', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const panel = await openFiltersPanel(user);
    await chooseComboboxOption(user, panel, 'District', 'Lalmonirhat');
    await chooseComboboxOption(user, panel, 'Upazila', 'Hatibandha');

    await chooseComboboxOption(user, panel, 'District', 'Gazipur');

    expect(
      within(panel).getByRole('combobox', { name: 'Upazila' }),
    ).toHaveValue('All upazilas');
  });

  it('clears and applies geography when Clear all filters is clicked', async () => {
    const user = userEvent.setup();
    const onGeographyChange = vi.fn();
    renderFilterBar({ onGeographyChange });

    const panel = await openFiltersPanel(user);
    await chooseComboboxOption(user, panel, 'Division', 'Dhaka');
    await chooseComboboxOption(user, panel, 'District', 'Gazipur');
    await user.click(
      within(panel).getByRole('button', { name: 'Clear all filters' }),
    );

    expect(onGeographyChange).toHaveBeenCalledWith(EMPTY_DASHBOARD_GEOGRAPHY);
    expect(
      screen.queryByRole('dialog', { name: 'Dashboard filters' }),
    ).not.toBeInTheDocument();
  });
});
