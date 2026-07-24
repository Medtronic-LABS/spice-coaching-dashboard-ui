import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { testModuleLibrary } from '@/test-utils/fixtures/moduleFixtures';
import {
  installModuleLibraryFetchMock,
  resetModuleLibraryFixtures,
} from '@/test-utils/installModuleLibraryFetchMock';
import { renderWithProviders } from '@/test-utils/render';
import { ModuleLibraryPage } from './ModuleLibraryPage';

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

async function waitForDomainOption(label: string) {
  await screen.findByRole('option', { name: label });
}

async function selectDomain(
  user: ReturnType<typeof userEvent.setup>,
  domain: string,
) {
  await waitForDomainOption(domain);
  const domainSelect = await getDomainSelect();
  await user.selectOptions(domainSelect, domain);
}

describe('ModuleLibraryPage', () => {
  beforeEach(() => {
    resetModuleLibraryFixtures();
    installModuleLibraryFetchMock();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to the drafts tab', async () => {
    renderModuleLibraryPage();

    const draftsTab = await screen.findByRole('tab', { name: /drafts/i });
    expect(draftsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('opens a draft module from its title', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(
      await screen.findByRole('link', {
        name: 'BP Measurement Technique',
      }),
    );

    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('orders tabs as Drafts, Published, Deactivated, All', async () => {
    renderModuleLibraryPage();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Drafts',
      'Published',
      'Deactivated',
      'All',
    ]);
  });

  it('opens drafts with the selected source document from navigation state', async () => {
    window.localStorage.setItem(
      'adminModuleLibraryView',
      JSON.stringify({
        tab: 'deactivated',
        filters: {
          domain: 'Hypertension',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
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
    expect(screen.getByLabelText(/source document/i)).toHaveValue(
      'Hypertension guide',
    );
    expect(await getDomainSelect()).toHaveValue('');
    expect(screen.getByLabelText(/^from$/i)).toHaveValue('');
    expect(screen.getByLabelText(/^to$/i)).toHaveValue('');
  });

  it('populates the source document filter from the backend catalog', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

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
    const user = userEvent.setup();
    renderModuleLibraryPage();

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

  it('shows linked published titles and Assign without Review', async () => {
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

  it('opens a deactivated module from its title', async () => {
    testModuleLibrary.modules[0].status = 'deactivated';
    const user = userEvent.setup();
    renderModuleLibraryPage(`${paths.moduleLibrary}?tab=deactivated`);

    await user.click(
      await screen.findByRole('link', {
        name: 'SPICE App — Visit Submission',
      }),
    );

    expect(screen.getByTestId('module-review')).toBeInTheDocument();
  });

  it('shows Review on drafts tab', async () => {
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

  it('shows tab-specific date columns', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await screen.findByRole('tab', { name: /drafts/i });
    expect(
      screen.getByRole('columnheader', { name: /^created$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /^published$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^published$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^activated$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^deactivated$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: /^published$/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^all$/i }));
    expect(
      screen.getByRole('columnheader', { name: /^created$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /^published$/i }),
    ).toBeInTheDocument();
  });

  it('filters modules by domain', async () => {
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
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.type(screen.getByLabelText(/^from$/i), '2000-01-01');
    await user.type(screen.getByLabelText(/^to$/i), '2000-01-02');

    expect(
      await screen.findByText('No modules match for the selected filters..'),
    ).toBeInTheDocument();
  });

  it('clears active filters', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const domainSelect = await getDomainSelect();
    await selectDomain(user, 'Hypertension');
    expect(
      await screen.findByRole('button', { name: /clear filters/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(domainSelect).toHaveValue('');
    expect(
      await screen.findByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();
  });

  it('keeps domain when it is available on the target tab', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const domainSelect = await getDomainSelect();
    await selectDomain(user, 'Hypertension');
    expect(domainSelect).toHaveValue('Hypertension');

    // Hypertension is also present on drafts, so the selection should carry.
    await user.click(screen.getByRole('tab', { name: /drafts/i }));
    expect(await getDomainSelect()).toHaveValue('Hypertension');
  });

  it('clears domain when it is not available on the target tab', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    await selectDomain(user, 'Referral');
    expect(await getDomainSelect()).toHaveValue('Referral');

    await user.click(screen.getByRole('tab', { name: /deactivated/i }));

    // Select may look cleared while domain is still in the URL/query; the
    // unfiltered empty copy proves the stale domain was dropped.
    await waitFor(() => {
      expect(
        screen.getByText(/no deactivated modules found/i),
      ).toBeInTheDocument();
    });
    expect(await getDomainSelect()).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: /clear filters/i }),
    ).not.toBeInTheDocument();
  });

  it('clears an invalid domain restored from the URL for the current tab', async () => {
    renderModuleLibraryPage(
      `${paths.moduleLibrary}?tab=deactivated&domain=Referral`,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no deactivated modules found/i),
      ).toBeInTheDocument();
    });
    expect(await getDomainSelect()).toHaveValue('');
  });

  it('restores filters from URL search params', async () => {
    renderModuleLibraryPage(
      `${paths.moduleLibrary}?tab=published&domain=Hypertension`,
    );

    await waitForDomainOption('Hypertension');
    expect(await getDomainSelect()).toHaveValue('Hypertension');
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
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    expect(
      await screen.findByText('SPICE App — Visit Submission'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^from$/i), '2026-12-31');
    await user.type(screen.getByLabelText(/^to$/i), '2026-01-01');

    expect(
      await screen.findByText(/from date must be on or before to date/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('SPICE App — Visit Submission'),
    ).not.toBeInTheDocument();
  });

  it('shows Deactivate button on published tab', async () => {
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('tab', { name: /published/i }));
    const deactivateButtons = await screen.findAllByRole('button', {
      name: /^deactivate$/i,
    });
    expect(deactivateButtons.length).toBeGreaterThan(0);
  });

  it('shows confirmation modal when deactivating a module and completes deactivation', async () => {
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
    const user = userEvent.setup();
    renderModuleLibraryPage();

    await user.click(screen.getByRole('button', { name: /create module/i }));

    const dialog = screen.getByRole('dialog', { name: /create module/i });
    expect(within(dialog).getByLabelText(/^domain/i)).toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText(/^sub-domain/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/domain & settings/i),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^difficulty level/i)).toHaveClass(
      'select-arrow',
    );
  });

  it('shows validation error when estimated minutes exceed the signed 32-bit integer max', async () => {
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
    await user.type(estimatedMinutesInput, '2147483648');

    expect(
      within(dialog).getByText(
        /estimated minutes cannot exceed 2,147,483,647\./i,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /create draft/i }),
    ).toBeDisabled();
  });

  it('creates a draft module with a normalized domain and null sub-domain', async () => {
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
