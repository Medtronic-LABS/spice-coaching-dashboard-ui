import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModuleAssignedUsersCell } from '@/features/modules/components/ModuleAssignedUsersCell';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { moduleEditReducer } from '@/features/modules/store/moduleEditSlice';
import { baseApi } from '@/store/apis/base';
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
    expect(viewButton.querySelector('svg')).toBeTruthy();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(viewButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Assigned users' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText('Loading assignees'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Loading assignees…')).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByText('Md Abdus Salam')).toBeInTheDocument();
    });
    expect(
      within(dialog).queryByLabelText('Loading assignees'),
    ).not.toBeInTheDocument();
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

  it('clears previous assignees before loading the next module modal', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        adminModuleReview: adminModuleReviewReducer,
        moduleEdit: moduleEditReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    const renderCell = (moduleId: string) =>
      render(
        <Provider store={store}>
          <MemoryRouter>
            <ModuleAssignedUsersCell moduleId={moduleId} enabled />
          </MemoryRouter>
        </Provider>,
      );

    const { rerender } = renderCell('htn-referral');

    await user.click(
      screen.getByRole('button', {
        name: 'View assigned users for module htn-referral',
      }),
    );

    let dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByText('Md Abdus Salam')).toBeInTheDocument();
    });

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <ModuleAssignedUsersCell moduleId="spice-visit" enabled />
        </MemoryRouter>
      </Provider>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'View assigned users for module spice-visit',
      }),
    );

    dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByText('Md Abdus Salam'),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        within(dialog).getByText('Mst. Hosneyara Begum'),
      ).toBeInTheDocument();
    });
  });
});
