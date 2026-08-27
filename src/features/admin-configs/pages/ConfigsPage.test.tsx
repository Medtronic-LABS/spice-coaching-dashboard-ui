import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigsPage } from '@/features/admin-configs/pages/ConfigsPage';
import {
  resetMockConfigsState,
  seedMockConfigChanges,
} from '@/store/apis/mockBaseQuery';
import { renderWithProviders } from '@/test-utils/render';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';

const FIND_TIMEOUT_MS = 4000;

async function waitForHistoryReady(expectedDays = '30') {
  const table = await screen.findByRole(
    'table',
    { name: /configuration history/i },
    { timeout: FIND_TIMEOUT_MS },
  );
  await within(table).findByText(
    expectedDays,
    {},
    { timeout: FIND_TIMEOUT_MS },
  );
  return table;
}

async function saveDuration(
  user: ReturnType<typeof userEvent.setup>,
  days: string,
) {
  const input = await screen.findByLabelText(/quiz reattempt validity days/i, {
    timeout: FIND_TIMEOUT_MS,
  });
  await user.clear(input);
  await user.type(input, days);
  await user.click(screen.getByRole('button', { name: /save changes/i }));
  await waitFor(
    () => {
      expect(
        screen.getByText('Quiz reattempt validity updated successfully.'),
      ).toBeInTheDocument();
    },
    { timeout: FIND_TIMEOUT_MS },
  );
}

describe('ConfigsPage configuration history', () => {
  beforeEach(() => {
    resetMockConfigsState();
  });

  it('renders history columns with the seed change newest-first', async () => {
    renderWithProviders(<ConfigsPage />);

    expect(
      await screen.findByRole(
        'heading',
        { name: /configuration history/i },
        { timeout: FIND_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();

    const table = await waitForHistoryReady();
    expect(
      within(table).getByRole('columnheader', {
        name: /last updated date & time/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: /updated by/i }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: /no\. of days/i }),
    ).toBeInTheDocument();

    expect(
      within(table).getByText(formatDisplayDateTime('2026-07-02T12:00:00Z')),
    ).toBeInTheDocument();
    expect(within(table).getByText('admin')).toBeInTheDocument();
    expect(within(table).getByText('30')).toBeInTheDocument();
  });

  it('shows actor names from updated_by objects and an em dash when null', async () => {
    seedMockConfigChanges('quiz_reattempt_validity_days', [
      {
        previous_value_json: 2,
        current_value_json: 1,
        updated_by: { id: 422, name: 'Mudassar Raza' },
        updated_at: '2026-08-17T05:48:10.167239Z',
      },
      {
        previous_value_json: 3,
        current_value_json: 2,
        updated_by: null,
        updated_at: '2026-08-14T20:09:43.027496Z',
      },
    ]);

    renderWithProviders(<ConfigsPage />);
    const table = await waitForHistoryReady('1');

    expect(within(table).getByText('Mudassar Raza')).toBeInTheDocument();
    expect(within(table).getByText('—')).toBeInTheDocument();
  });

  it('appends a new history row after a successful save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfigsPage />);

    const table = await waitForHistoryReady();
    await saveDuration(user, '45');

    await waitFor(
      () => {
        expect(within(table).getByText('45')).toBeInTheDocument();
      },
      { timeout: FIND_TIMEOUT_MS },
    );
    expect(within(table).getByText('30')).toBeInTheDocument();
  });

  it('blocks extra digits beyond the 365-day budget', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfigsPage />);

    const input = await screen.findByLabelText(
      /quiz reattempt validity days/i,
      { timeout: FIND_TIMEOUT_MS },
    );
    expect(input).toHaveAttribute('maxLength', '3');

    await user.clear(input);
    await user.type(input, '9999');
    expect(input).toHaveValue('999');
    expect(
      screen.getByText(/duration cannot exceed 365 days/i),
    ).toBeInTheDocument();
  });

  it('paginates history with the shared table controls', async () => {
    const user = userEvent.setup();
    seedMockConfigChanges('quiz_reattempt_validity_days', [
      {
        previous_value_json: 70,
        current_value_json: 80,
        updated_by: 'admin',
        updated_at: '2026-08-12T15:00:00Z',
      },
      {
        previous_value_json: 60,
        current_value_json: 70,
        updated_by: 'admin',
        updated_at: '2026-08-12T14:00:00Z',
      },
      {
        previous_value_json: 50,
        current_value_json: 60,
        updated_by: 'admin',
        updated_at: '2026-08-12T13:00:00Z',
      },
      {
        previous_value_json: 40,
        current_value_json: 50,
        updated_by: 'admin',
        updated_at: '2026-08-12T12:00:00Z',
      },
      {
        previous_value_json: 30,
        current_value_json: 40,
        updated_by: 'admin',
        updated_at: '2026-08-12T11:00:00Z',
      },
      {
        previous_value_json: null,
        current_value_json: 30,
        updated_by: 'admin',
        updated_at: '2026-07-02T12:00:00Z',
      },
    ]);

    renderWithProviders(<ConfigsPage />);
    const table = await waitForHistoryReady('80');

    await user.click(
      screen.getByLabelText(/configuration history rows per page/i),
    );
    await user.click(screen.getByRole('option', { name: '5' }));

    const nextButton = screen.getByRole('button', { name: /^next page$/i });
    await waitFor(
      () => {
        expect(nextButton).toBeEnabled();
      },
      { timeout: FIND_TIMEOUT_MS },
    );
    await user.click(nextButton);

    await waitFor(
      () => {
        expect(within(table).getByText('30')).toBeInTheDocument();
        expect(within(table).queryByText('80')).not.toBeInTheDocument();
      },
      { timeout: FIND_TIMEOUT_MS },
    );
  }, 15_000);
});
