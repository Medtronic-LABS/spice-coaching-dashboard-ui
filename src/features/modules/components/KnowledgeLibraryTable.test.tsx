import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { KnowledgeLibraryTable } from '@/features/modules/components/KnowledgeLibraryTable';
import { renderWithProviders } from '@/test-utils/render';

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

    await waitFor(
      () => {
        expect(screen.getByText('HTN Referral Guidelines')).toBeInTheDocument();
        expect(
          screen.queryByText('Visit Workflow — Overview'),
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
    expect(
      screen.getByText(
        'Assign this document to the selected PO and all SKs under them.',
      ),
    ).toBeInTheDocument();
  });
});
