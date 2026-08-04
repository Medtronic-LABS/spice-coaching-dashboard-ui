import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { paths } from '@/constants/routes';
import { mockModuleLibrary } from '@/store/apis/mockData';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleLibraryPage } from './ModuleLibraryPage';
import type { AppRole } from '@/constants/role';

const roleState = vi.hoisted(() => ({ role: 'supervisor' as AppRole }));

function snapshotModuleStatuses() {
  return mockModuleLibrary.modules.map((module) => ({
    id: module.id,
    status: module.status,
  }));
}

vi.mock('@/constants/role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/role')>();
  return {
    ...actual,
    getCurrentRole: () => roleState.role,
  };
});

const initialModuleStatuses = snapshotModuleStatuses();

function resetMockModuleStatuses() {
  for (const entry of initialModuleStatuses) {
    const module = mockModuleLibrary.modules.find(
      (item) => item.id === entry.id,
    );
    if (module) {
      module.status = entry.status;
    }
  }
}

function renderModuleLibraryPage(route = paths.moduleLibrary) {
  return renderWithProviders(
    <Routes>
      <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
      <Route
        path={paths.adminModuleReviewDetails}
        element={<div data-testid="module-review" />}
      />
      <Route
        path={paths.moduleAssigned}
        element={<div data-testid="module-assigned" />}
      />
    </Routes>,
    { route },
  );
}

async function getDomainSelect() {
  return screen.findByLabelText(/^domain$/i);
}

async function openFiltersDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /open filters/i }));
  expect(
    await screen.findByRole('heading', { name: /^filters$/i }),
  ).toBeInTheDocument();
}

async function applyFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^apply$/i }));
}

async function waitForDomainOption(label: string) {
  await screen.findByRole('option', { name: label });
}

async function selectDomain(
  user: ReturnType<typeof userEvent.setup>,
  domain: string,
) {
  await openFiltersDrawer(user);
  await waitForDomainOption(domain);
  const domainSelect = await getDomainSelect();
  await user.selectOptions(domainSelect, domain);
  await applyFilters(user);
}

describe('ModuleLibraryPage', () => {
  beforeEach(() => {
    roleState.role = 'supervisor';
    resetMockModuleStatuses();
    window.localStorage.clear();
  });

  it('shows filter button for supervisor without tabs', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    expect(
      await screen.findByRole('button', { name: /open filters/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /drafts/i }),
    ).not.toBeInTheDocument();

    await openFiltersDrawer(user);
    expect(await getDomainSelect()).toBeInTheDocument();
    expect(screen.getByLabelText(/created date from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/created date to/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/published date from/i)).toBeInTheDocument();
  });

  it('shows linked published titles and Assign without Review for supervisors', async () => {
    renderModuleLibraryPage();

    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    expect(assignButtons.length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: 'SPICE App — Visit Submission' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^review$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^edit$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /drafts/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /all/i })).not.toBeInTheDocument();
  });

  it('opens a published module from its title for supervisors', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(
      await screen.findByRole('link', {
        name: 'SPICE App — Visit Submission',
      }),
    );
    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('navigates to assign flow for supervisor', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    await user.click(assignButtons[0]);
    expect(
      screen.getByRole('heading', { name: /assign module/i }),
    ).toBeInTheDocument();
  });

  it('defaults program manager to the drafts tab', async () => {
    roleState.role = 'programManager';
    renderModuleLibraryPage();

    const draftsTab = await screen.findByRole('tab', { name: /drafts/i });
    expect(draftsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('opens a draft module from its title for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(
      await screen.findByRole('link', {
        name: 'BP Measurement Technique',
      }),
    );

    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('orders program manager tabs as Drafts, Published, Needs Review, Deactivated, Discarded, All', async () => {
    roleState.role = 'programManager';
    renderModuleLibraryPage();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Drafts',
      'Published',
      'Needs Reviewi',
      'Deactivated',
      'Discarded',
      'All',
    ]);
  });

  it('opens drafts with the selected source document from navigation state', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    window.localStorage.setItem(
      'adminModuleLibraryView',
      JSON.stringify({
        tab: 'deactivated',
        filters: {
          domain: 'Hypertension',
          createdFrom: '2026-01-01',
          createdTo: '2026-01-31',
          sourceDocumentId: 'stale-doc',
        },
      }),
    );
    renderWithProviders(
      <Routes>
        <Route path={paths.moduleLibrary} element={<ModuleLibraryPage />} />
      </Routes>,
      {
        route: paths.moduleLibrary,
        routerState: {
          tab: 'drafts',
          sourceDocumentId: 'doc-ingest-123',
          sourceDocumentTitle: 'Hypertension guide',
        },
      },
    );

    expect(await screen.findByRole('tab', { name: /drafts/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await openFiltersDrawer(user);
    expect(screen.getByLabelText(/source document/i)).toHaveValue(
      'Hypertension guide',
    );
    expect(await getDomainSelect()).toHaveValue('');
    expect(screen.getByLabelText(/created date from/i)).toHaveValue('');
    expect(screen.getByLabelText(/created date to/i)).toHaveValue('');
  });

  it('populates the source document filter from the backend catalog for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await openFiltersDrawer(user);
    const combobox = await screen.findByLabelText(/source document/i);
    await user.click(combobox);
    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: /hypertension referral protocol/i,
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('option', {
        name: /spice app visit submission guide/i,
      }),
    ).toBeInTheDocument();
  });

  it('searches source documents server-side as the user types', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await openFiltersDrawer(user);
    const combobox = await screen.findByLabelText(/source document/i);
    await user.click(combobox);
    await user.keyboard('hypertension referral');

    // Wait for the debounced server-side search to narrow the option list so the
    // absence assertion runs after the refetch, not before it.
    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: /hypertension referral protocol/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('option', {
          name: /spice app visit submission guide/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('shows linked published titles and Assign without Review for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const assignButtons = await screen.findAllByRole('button', {
      name: /^assign$/i,
    });
    expect(assignButtons.length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: 'SPICE App — Visit Submission' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^review$/i }),
    ).not.toBeInTheDocument();
  });

  it('opens a deactivated module from its title for program manager', async () => {
    roleState.role = 'programManager';
    mockModuleLibrary.modules[0].status = 'deactivated';
    const user = userEvent.setup();
    renderModuleLibraryPage(`${paths.moduleLibrary}?tab=deactivated`);

    await user.click(
      await screen.findByRole('link', {
        name: 'SPICE App — Visit Submission',
      }),
    );

    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('shows Review on drafts tab for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /drafts/i }));
    const reviewButtons = await screen.findAllByRole('button', {
      name: /^review$/i,
    });
    expect(reviewButtons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /^edit$/i }),
    ).not.toBeInTheDocument();
  });

  it('shows tab-specific date columns for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await screen.findByRole('tab', { name: /drafts/i });
    expect(
      screen.getByRole('columnheader', { name: /^created at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /^published at$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^published at$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^activated at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^deactivated at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /^published at$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^all$/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created at$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^published at$/i }),
    ).toBeInTheDocument();
  });

  it('filters modules by domain for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await selectDomain(user, 'Hypertension');

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(
        within(table).getByText('HTN Referral Thresholds'),
      ).toBeInTheDocument();
      expect(
        within(table).queryByText('SPICE App — Visit Submission'),
      ).not.toBeInTheDocument();
    });
  });

  it('shows filtered empty state when no modules match', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await openFiltersDrawer(user);
    await user.type(screen.getByLabelText(/created date from/i), '2000-01-01');
    await user.type(screen.getByLabelText(/created date to/i), '2000-01-02');
    await applyFilters(user);

    expect(
      await screen.findByText('No modules match for the selected filters.'),
    ).toBeInTheDocument();
  });

  it('applies typed date filters to the URL and shows the active filter tooltip', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    expect(
      await screen.findByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/use filters to narrow results/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/use filters \(filter icon on the right\)/i),
    ).not.toBeInTheDocument();

    await openFiltersDrawer(user);
    await user.type(
      screen.getByLabelText(/published date from/i),
      '2000-01-01',
    );
    await user.type(screen.getByLabelText(/published date to/i), '2000-01-02');
    await applyFilters(user);

    const filterButton = screen.getByRole('button', { name: /open filters/i });
    expect(filterButton).toHaveAttribute(
      'aria-describedby',
      expect.stringMatching(/.+/),
    );
    expect(
      await screen.findByText(/results reflect the filters currently applied/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No modules match for the selected filters.'),
    ).toBeInTheDocument();

    await openFiltersDrawer(user);
    expect(screen.getByLabelText(/published date from/i)).toHaveValue(
      '2000-01-01',
    );
    expect(screen.getByLabelText(/published date to/i)).toHaveValue(
      '2000-01-02',
    );
  });

  it('shows activated and deactivated date filters on the deactivated tab', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));
    await openFiltersDrawer(user);

    expect(screen.getByLabelText(/^created date from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^published date from$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^activated date from$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^deactivated date from$/i),
    ).toBeInTheDocument();
  });

  it('clears active filters', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await selectDomain(user, 'Hypertension');
    expect(
      await screen.findByRole('button', { name: /open filters/i }),
    ).toBeInTheDocument();

    await openFiltersDrawer(user);
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    expect(await getDomainSelect()).toHaveValue('');
    expect(
      await screen.findByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();
  });

  it('persists domain selection across tabs', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await selectDomain(user, 'Hypertension');

    await user.click(screen.getByRole('tab', { name: /drafts/i }));
    await openFiltersDrawer(user);
    expect(await getDomainSelect()).toHaveValue('Hypertension');

    await user.click(screen.getByRole('button', { name: /close filters/i }));
    await user.click(screen.getByRole('tab', { name: /deactivated/i }));
    await openFiltersDrawer(user);
    expect(await getDomainSelect()).toHaveValue('Hypertension');
  });

  it('keeps a domain that only exists on another lifecycle status when switching tabs', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await selectDomain(user, 'Referral');

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));

    await openFiltersDrawer(user);
    expect(await getDomainSelect()).toHaveValue('Referral');
    // Domain options stay unscoped (All-tab set), so Referral remains selectable.
    expect(
      screen.getByRole('option', { name: 'Referral' }),
    ).toBeInTheDocument();
  });

  it('restores a domain from the URL on any tab using unscoped domain options', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage(
      `${paths.moduleLibrary}?tab=deactivated&domain=Referral`,
    );

    await openFiltersDrawer(user);
    await waitForDomainOption('Referral');
    expect(await getDomainSelect()).toHaveValue('Referral');
  });

  it('restores filters from URL search params', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage(
      `${paths.moduleLibrary}?tab=published&domain=Hypertension`,
    );

    await openFiltersDrawer(user);
    await waitForDomainOption('Hypertension');
    expect(await getDomainSelect()).toHaveValue('Hypertension');
    await user.click(screen.getByRole('button', { name: /close filters/i }));
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(
        within(table).getByText('HTN Referral Thresholds'),
      ).toBeInTheDocument();
      expect(
        within(table).queryByText('SPICE App — Visit Submission'),
      ).not.toBeInTheDocument();
    });
  });

  it('shows date range validation error for invalid ranges', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    expect(
      await screen.findByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();

    await openFiltersDrawer(user);
    await user.type(screen.getByLabelText(/created date from/i), '2026-12-31');
    await user.type(screen.getByLabelText(/created date to/i), '2026-01-01');

    expect(
      await screen.findByText(/from date must be on or before to date/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^apply$/i })).toBeDisabled();
    expect(
      screen.getByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();
  });

  it('shows validation error for partial date ranges', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await openFiltersDrawer(user);
    await user.type(screen.getByLabelText(/created date from/i), '2026-12-31');

    expect(
      await screen.findByText(/both from and to dates are required/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^apply$/i })).toBeDisabled();
  });

  it('shows contextual date filters by tab and discards draft on close', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await openFiltersDrawer(user);
    expect(screen.getByLabelText(/created date from/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/published date from/i),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/created date from/i), '2026-01-01');
    await user.click(screen.getByRole('button', { name: /close filters/i }));

    await openFiltersDrawer(user);
    expect(screen.getByLabelText(/created date from/i)).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /close filters/i }));
    await user.click(screen.getByRole('tab', { name: /published/i }));
    await openFiltersDrawer(user);
    expect(screen.getByLabelText(/created date from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/published date from/i)).toBeInTheDocument();
  });

  it('shows Deactivate button on published tab for program manager', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const deactivateButtons = await screen.findAllByRole('button', {
      name: /^deactivate$/i,
    });
    expect(deactivateButtons.length).toBeGreaterThan(0);
  });

  it('shows confirmation modal when deactivating a module and completes deactivation', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const deactivateButtons = await screen.findAllByRole('button', {
      name: /^deactivate$/i,
    });
    await user.click(deactivateButtons[0]);

    expect(
      screen.getByRole('heading', { name: /deactivate module/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no longer be visible to users for new assignments/i),
    ).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: /^deactivate$/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /deactivate module/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('shows Activate button on deactivated tab and completes activation', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const deactivateButtons = await screen.findAllByRole('button', {
      name: /^deactivate$/i,
    });
    await user.click(deactivateButtons[0]);
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: /^deactivate$/i }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /deactivate module/i }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));
    const activateButtons = await screen.findAllByRole('button', {
      name: /^activate$/i,
    });
    expect(activateButtons.length).toBeGreaterThan(0);

    await user.click(activateButtons[0]);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /^activate$/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('keeps create draft disabled until title (BN) and domain are provided', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    const createDraft = within(dialog).getByRole('button', {
      name: /create draft/i,
    });

    expect(createDraft).toBeDisabled();

    await user.type(
      within(dialog).getByPlaceholderText(/বাংলা শিরোনাম/i),
      'টেস্ট',
    );
    expect(createDraft).toBeDisabled();

    const domainSelect = await within(dialog).findByRole('combobox', {
      name: /^domain$/i,
    });
    await user.selectOptions(domainSelect, 'Enter new…');
    await user.type(within(dialog).getByPlaceholderText(/rmnch/i), 'RMNCH');

    expect(createDraft).toBeEnabled();
  });

  it('shows domain field without sub-domain in the create module dialog', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    expect(
      within(dialog).getByRole('textbox', { name: /domain/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText(/^sub-domain$/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/domain & settings/i),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^difficulty level/i)).toHaveClass(
      'select-arrow',
    );
  });

  it('shows validation error when estimated minutes exceed 60', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    await user.type(
      within(dialog).getByPlaceholderText(/বাংলা শিরোনাম/i),
      'টেস্ট',
    );

    const estimatedMinutesInput =
      within(dialog).getByLabelText(/^estimated minutes$/i);
    await user.clear(estimatedMinutesInput);
    await user.type(estimatedMinutesInput, '61');

    expect(
      within(dialog).getByText(/estimated minutes cannot exceed 60\./i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /create draft/i }),
    ).toBeDisabled();
  });

  it('shows required error when estimated minutes is 0', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    await user.type(
      within(dialog).getByPlaceholderText(/বাংলা শিরোনাম/i),
      'টেস্ট',
    );

    const estimatedMinutesInput =
      within(dialog).getByLabelText(/^estimated minutes$/i);
    await user.clear(estimatedMinutesInput);
    await user.type(estimatedMinutesInput, '0');

    expect(
      within(dialog).getByText(/estimated minutes are required\./i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /create draft/i }),
    ).toBeDisabled();
  });

  it('creates a draft module with a normalized domain and null sub-domain', async () => {
    roleState.role = 'programManager';
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    await user.type(
      within(dialog).getByPlaceholderText(/বাংলা শিরোনাম/i),
      'টেস্ট',
    );
    const domainSelect = await within(dialog).findByRole('combobox', {
      name: /^domain$/i,
    });
    await user.selectOptions(domainSelect, 'Enter new…');
    await user.type(within(dialog).getByPlaceholderText(/rmnch/i), 'RMNCH');

    await user.click(
      within(dialog).getByRole('button', { name: /create draft/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('module-review')).toBeInTheDocument();
    });
  });
});
