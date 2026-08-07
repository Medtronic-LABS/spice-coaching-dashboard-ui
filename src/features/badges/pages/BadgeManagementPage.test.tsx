import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { paths } from '@/constants/routes';
import { renderWithProviders } from '@/test-utils/render';
import { BadgeManagementPage } from './BadgeManagementPage';

function renderPage() {
  return renderWithProviders(<BadgeManagementPage />, {
    route: paths.badgeManagement,
  });
}

describe('BadgeManagementPage', () => {
  it('lists milestones sorted by sequence and supports search', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Badge Management' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Safe Motherhood Champion')).toBeInTheDocument();
      expect(screen.getByText('SPICE Navigator')).toBeInTheDocument();
      expect(screen.getByText('Referral Pro')).toBeInTheDocument();
      expect(
        screen.getByText(/HTN Referral Thresholds.*FBS vs RBS/),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Community Clinic Referral Protocol'),
      ).toBeInTheDocument();
    });

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

  it('loads a row into the form for editing without a sequence field', async () => {
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
      within(dataRow!).getByRole('button', {
        name: 'Move Safe Motherhood Champion up in sequence',
      }),
    ).toBeDisabled();
    expect(
      within(dataRow!).getByRole('button', {
        name: 'Move Safe Motherhood Champion down in sequence',
      }),
    ).toBeEnabled();
  });

  it('exposes module-library-style pagination controls', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    expect(screen.getByLabelText('Rows per page')).toHaveValue('10');
    expect(screen.getByLabelText('Page number')).toHaveValue(1);
    expect(screen.getByText('Rows')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Rows per page'), '5');
    expect(screen.getByLabelText('Rows per page')).toHaveValue('5');
  });

  it('reorders adjacent milestones without requiring a catalog refetch', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Safe Motherhood Champion');

    await user.click(
      screen.getByRole('button', {
        name: 'Move Safe Motherhood Champion down in sequence',
      }),
    );

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]!).getByText('SPICE Navigator')).toBeInTheDocument();
      expect(
        within(rows[1]!).getByText('Safe Motherhood Champion'),
      ).toBeInTheDocument();
      expect(within(rows[0]!).getByText('1')).toBeInTheDocument();
      expect(within(rows[1]!).getByText('2')).toBeInTheDocument();
    });
  });

  it('excludes chatbot FAQ-only modules from the create form picker', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: 'Create milestone' });

    const domainInput = screen.getByRole('combobox', { name: 'Domain' });
    await user.click(domainInput);
    await user.click(
      await screen.findByRole('option', { name: 'Hypertension' }),
    );

    await waitFor(() => {
      expect(screen.getByText('HTN Referral Thresholds')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Hypertension Chatbot FAQs'),
    ).not.toBeInTheDocument();
  });
});
