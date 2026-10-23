import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminModulesListItem } from '@/features/modules/api/adminModulesApi';
import { formatDisplayDateTime } from '@/utils/formatDisplayDateTime';
import { DiscardedTabTable } from './DiscardedTabTable';

const RETIRED_AT = '2026-03-01T00:00:00.000Z';
const CREATED_AT = '2025-12-01T00:00:00.000Z';

function discardedModule(
  overrides: Partial<AdminModulesListItem> & Pick<AdminModulesListItem, 'id'>,
): AdminModulesListItem {
  return {
    module_family_id: 'fam-1',
    version: 1,
    title: 'Discarded Module',
    description: null,
    domain: 'ncd',
    module_type: 'training',
    lifecycle_status: 'retired',
    clinically_reviewed: false,
    has_visibility_window: false,
    card_count: 1,
    estimated_minutes: 5,
    published_at: null,
    created_at: CREATED_AT,
    updated_at: '2026-03-02T00:00:00.000Z',
    quiz_count: 0,
    ...overrides,
  };
}

describe('DiscardedTabTable', () => {
  it('prefers retired_by, then discarded_by metadata, then previous status badges', () => {
    render(
      <DiscardedTabTable
        modules={[
          discardedModule({
            id: 'mod-retired-by',
            title: 'From retired_by',
            retired_by: { id: 1, name: 'Ada Lovelace' },
            deactivated_by: { id: 9, name: 'Ignored Deactivator' },
            search_metadata: { discarded_by: 'Ignored Metadata' },
            published_at: '2026-01-15T00:00:00.000Z',
            retired_at: RETIRED_AT,
            deactivated_at: '2026-02-01T00:00:00.000Z',
          }),
          discardedModule({
            id: 'mod-metadata-string',
            title: 'From metadata string',
            search_metadata: {
              discarded_by: '  Rina Actor  ',
              previous_status: 'Published',
            },
            retired_at: RETIRED_AT,
          }),
          discardedModule({
            id: 'mod-created-at-fallback',
            title: 'From created_at fallback',
            search_metadata: { discarded_by: { name: 'Rokeya Akter' } },
          }),
        ]}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Rina Actor')).toBeInTheDocument();
    expect(screen.getByText('Rokeya Akter')).toBeInTheDocument();
    expect(screen.queryByText('Ignored Metadata')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored Deactivator')).not.toBeInTheDocument();

    expect(screen.getAllByText('Discarded')).toHaveLength(3);
    expect(screen.getAllByText('Published')).toHaveLength(2);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getAllByText(formatDisplayDateTime(RETIRED_AT))).toHaveLength(
      2,
    );
    expect(
      screen.getByText(formatDisplayDateTime(CREATED_AT)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(formatDisplayDateTime('2026-02-01T00:00:00.000Z')),
    ).not.toBeInTheDocument();
  });

  it('calls onView when View is clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(
      <DiscardedTabTable
        modules={[discardedModule({ id: 'mod-view' })]}
        onView={onView}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith('mod-view');
  });
});
