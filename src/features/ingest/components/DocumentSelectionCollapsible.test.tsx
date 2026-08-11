import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DocumentSelectionCollapsible } from '@/features/ingest/components/DocumentSelectionCollapsible';
import { renderWithProviders } from '@/test-utils/render';

function ControlledCollapsible() {
  const [open, setOpen] = useState(true);
  return (
    <DocumentSelectionCollapsible
      title="Document Selection"
      open={open}
      onOpenChange={setOpen}
      collapsedSummary="2 documents selected"
    >
      <div>Panel body</div>
    </DocumentSelectionCollapsible>
  );
}

describe('DocumentSelectionCollapsible', () => {
  it('toggles expanded content without clearing children when reopened', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledCollapsible />);

    expect(screen.getByText('Panel body')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Collapse Document Selection' }),
    );
    expect(screen.queryByText('Panel body')).not.toBeInTheDocument();
    expect(screen.getByText('2 documents selected')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Expand Document Selection' }),
    );
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });

  it('shows header aside only while expanded', async () => {
    const user = userEvent.setup();
    function WithAside() {
      const [open, setOpen] = useState(true);
      return (
        <DocumentSelectionCollapsible
          title="Document Selection"
          open={open}
          onOpenChange={setOpen}
          headerAside={
            <input type="search" aria-label="Search knowledge documents" />
          }
        >
          <div>Panel body</div>
        </DocumentSelectionCollapsible>
      );
    }

    renderWithProviders(<WithAside />);
    expect(
      screen.getByRole('searchbox', { name: /search knowledge documents/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Collapse Document Selection' }),
    );
    expect(
      screen.queryByRole('searchbox', { name: /search knowledge documents/i }),
    ).not.toBeInTheDocument();
  });
});
