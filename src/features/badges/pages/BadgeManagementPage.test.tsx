import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { BadgeManagementPage } from './BadgeManagementPage';

function renderPage() {
  return renderWithProviders(<BadgeManagementPage />, {
    route: paths.badgeManagement,
  });
}

function setElementWidth(
  element: HTMLElement,
  clientWidth: number,
  scrollWidth: number,
) {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
  });
}

function assertElementPrecedes(follower: Element, leader: Element) {
  expect(
    leader.compareDocumentPosition(follower) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
}

describe('BadgeManagementPage', () => {
  it('lists milestones sorted by sequence and supports search', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Milestone Management' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Learners earn a milestone after completing all mapped active modules/,
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Safe Motherhood Champion')).toBeInTheDocument();
      expect(screen.getByText('SPICE Navigator')).toBeInTheDocument();
      expect(screen.getByText('Referral Pro')).toBeInTheDocument();
      expect(
        screen.getByText('HTN Referral Thresholds, FBS vs RBS — Timing Rules'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Community Clinic Referral Protocol'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('columnheader', { name: 'Created By' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Updated By' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('bob').length).toBeGreaterThan(0);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search milestones' }),
      'Referral',
    );

    await waitFor(() => {
      expect(screen.getByText('Referral Pro')).toBeInTheDocument();
      expect(
        screen.queryByText('Safe Motherhood Champion'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders toolbar controls in rearrange-create-search-filter order', async () => {
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    const rearrange = screen.getByRole('button', {
      name: 'Rearrange Milestone',
    });
    const create = screen.getByRole('button', { name: 'Create Milestone' });
    const search = screen.getByRole('searchbox', {
      name: 'Search milestones',
    });
    const filter = screen.getByRole('button', {
      name: 'Open milestone filters',
    });

    assertElementPrecedes(create, rearrange);
    assertElementPrecedes(search, create);
    assertElementPrecedes(filter, search);
  });

  it('opens the edit modal without a sequence field', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    const rows = screen.getAllByRole('row');
    const dataRow = rows.find((row) =>
      within(row).queryByText('Safe Motherhood Champion'),
    );
    expect(dataRow).toBeTruthy();

    await user.click(within(dataRow!).getByRole('button', { name: 'Edit' }));

    expect(
      await screen.findByRole('heading', { name: 'Edit milestone' }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Safe Motherhood Champion'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Sequence')).not.toBeInTheDocument();
    expect(screen.getByText('Milestone name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Domain' }),
    ).not.toBeInTheDocument();
  });

  it('exposes module-library-style pagination controls', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    expect(screen.getByLabelText('Rows per page')).toHaveValue('10');
    expect(screen.getByLabelText('Page number')).toHaveValue('1');
    expect(screen.getByText('Rows')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Rows per page'), '5');
    expect(screen.getByLabelText('Rows per page')).toHaveValue('5');
  });

  it('uses TruncatedText for table module lists and reveals the full list on hover', async () => {
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    const label = 'HTN Referral Thresholds, FBS vs RBS — Timing Rules';
    const content = screen.getByText(label);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 360);

    fireEvent.mouseEnter(trigger!);
    expect(
      screen.getAllByRole('tooltip').some((node) => node.textContent === label),
    ).toBe(true);
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it('enters sequence edit mode with drag handles and disables search', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    await user.click(
      screen.getByRole('button', { name: 'Rearrange Milestone' }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Save Rearrangement' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Save Rearrangement' }),
      ).toBeDisabled();
    });

    expect(
      screen.getByRole('button', { name: 'Search milestones' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Create Milestone' }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('button', { name: 'Back to list' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Rearrange Milestone' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Drag the handle on each row/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Milestones are listed in sequence order/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Seq')).toBeInTheDocument();
    expect(screen.getByText('Milestone')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(
      screen.getByText('HTN Referral Thresholds, FBS vs RBS — Timing Rules'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to list' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Rearrange Milestone' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('searchbox', { name: 'Search milestones' }),
    ).not.toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Save Rearrangement' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Safe Motherhood Champion')).toBeInTheDocument();
  });

  it('opens create modal and excludes chatbot FAQ-only modules from the picker', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    await user.click(screen.getByRole('button', { name: 'Create Milestone' }));

    expect(
      await screen.findByRole('heading', { name: 'Create milestone' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('HTN Referral Thresholds')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Hypertension Chatbot FAQs'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Domain' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Domain' }),
    ).not.toBeInTheDocument();
  });
});
