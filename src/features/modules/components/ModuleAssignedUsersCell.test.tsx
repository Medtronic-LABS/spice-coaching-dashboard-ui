import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ModuleAssignedUsersCell } from '@/features/modules/components/ModuleAssignedUsersCell';
import { renderWithProviders } from '@/test-utils/render';

describe('ModuleAssignedUsersCell', () => {
  it('shows a centered dash when assignment lookup is disabled', () => {
    renderWithProviders(
      <ModuleAssignedUsersCell moduleId="mod-1" enabled={false} />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /view assigned users/i }),
    ).not.toBeInTheDocument();
  });

  it('opens the modal immediately on View and then shows chips', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ModuleAssignedUsersCell moduleId="htn-referral" enabled />,
    );

    const viewButton = screen.getByRole('button', {
      name: 'View assigned users for module htn-referral',
    });
    expect(viewButton).toHaveTextContent('View');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(viewButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Assigned users' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByText('Md Abdus Salam')).toBeInTheDocument();
    });
    expect(within(dialog).getByText('PO')).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText(/^\d+ assigned users$/),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/^\d+ users?$/i)).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/shasthya kormi|shahistya kormi/i),
    ).not.toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Close' }),
    ).toBeInTheDocument();
  });

  it('shows SK (not Shasthya Kormi) for SK assignees', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ModuleAssignedUsersCell moduleId="spice-visit" enabled />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'View assigned users for module spice-visit',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(
        within(dialog).getByText('Mst. Hosneyara Begum'),
      ).toBeInTheDocument();
    });
    expect(within(dialog).getByText('SK')).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/shasthya kormi|shahistya kormi/i),
    ).not.toBeInTheDocument();
  });

  it('opens the modal for empty assignees then shows a dash after close', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ModuleAssignedUsersCell moduleId="module-with-no-assignees" enabled />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'View assigned users for module module-with-no-assignees',
      }),
    );

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByText('—')).toBeInTheDocument();
    });

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /view assigned users/i }),
    ).not.toBeInTheDocument();
  });
});
