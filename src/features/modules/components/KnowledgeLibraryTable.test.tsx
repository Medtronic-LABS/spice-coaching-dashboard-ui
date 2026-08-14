import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { KnowledgeLibraryTable } from '@/features/modules/components/KnowledgeLibraryTable';
import { renderWithProviders } from '@/test-utils/render';

async function openKnowledgeFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: /open knowledge filters/i }),
  );
  return screen.getByRole('dialog', { name: 'Filters' });
}

describe('KnowledgeLibraryTable', () => {
  it('debounces the knowledge search query before filtering results', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();
    expect(screen.getByText('Visit Workflow — Overview')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Thumbnail' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'File Title' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'File Type' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded Date' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Uploaded By' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Last Updated' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Actions' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Edit' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Assign' }).length,
    ).toBeGreaterThan(0);

    const search = screen.getByPlaceholderText(/search knowledge/i);
    await user.type(search, 'HTN');

    // Instant typing keeps us inside the 300ms window — list is still unfiltered.
    expect(screen.getByText('Visit Workflow — Overview')).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /loading knowledge assets/i }),
    ).not.toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText('HTN Referral Guidelines')).toBeInTheDocument();
        expect(
          screen.queryByText('Visit Workflow — Overview'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('status', { name: /loading knowledge assets/i }),
        ).not.toBeInTheDocument();
      },
      { timeout: 1500 },
    );
  });

  it('opens the shared source-document assignment dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Assign' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Assign document' }),
    ).toBeInTheDocument();
  });

  it('uses Module Library-style 0-based pagination controls', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();

    const rowsSelect = screen.getByLabelText('Rows per page');
    expect(rowsSelect).toHaveValue('10');
    expect(
      Array.from((rowsSelect as HTMLSelectElement).options).map((o) => o.value),
    ).toEqual(['5', '10', '15', '25', '50']);

    expect(screen.getByLabelText('Page number')).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText(/Showing/)).toHaveTextContent(/Showing/);

    await user.selectOptions(rowsSelect, '5');
    expect(screen.getByLabelText('Rows per page')).toHaveValue('5');
    expect(screen.getByLabelText('Page number')).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('opens the edit and retire modals from row actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(
      await screen.findByRole('heading', { name: 'Edit Knowledge Asset' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Edit Knowledge Asset' }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(
      await screen.findByRole('heading', { name: 'Remove Knowledge Document' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Confirm Remove' }),
    ).toBeInTheDocument();
  });

  it('hides Edit, Assign, and Delete on retired rows', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Retired' }));

    expect(
      await screen.findByText('Retired Protocol Notes'),
    ).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(
      within(table).getAllByRole('button', { name: 'Download' }).length,
    ).toBeGreaterThan(0);
    expect(
      within(table).queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole('button', { name: 'Assign' }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('clears applied filters immediately on Clear All', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeLibraryTable />);

    expect(
      await screen.findByText('HTN Referral Guidelines'),
    ).toBeInTheDocument();
    expect(screen.getByText('Visit Workflow — Overview')).toBeInTheDocument();

    const dialog = await openKnowledgeFilters(user);
    await user.selectOptions(within(dialog).getByLabelText('Assigned'), 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(screen.getByText('HTN Referral Guidelines')).toBeInTheDocument();
      expect(
        screen.queryByText('Visit Workflow — Overview'),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', {
        name: /open knowledge filters \(filters applied\)/i,
      }),
    ).toBeInTheDocument();

    const reopened = await openKnowledgeFilters(user);
    expect(within(reopened).getByLabelText('Assigned')).toHaveValue('true');
    await user.click(
      within(reopened).getByRole('button', { name: 'Clear All' }),
    );

    expect(within(reopened).getByLabelText('Assigned')).toHaveValue('');
    await waitFor(() => {
      expect(screen.getByText('HTN Referral Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Visit Workflow — Overview')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /^open knowledge filters$/i }),
    ).toBeInTheDocument();
  });
});
