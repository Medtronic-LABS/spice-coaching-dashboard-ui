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
});
