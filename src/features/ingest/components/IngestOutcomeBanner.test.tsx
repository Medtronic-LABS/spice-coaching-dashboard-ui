import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IngestOutcomeBanner } from './IngestOutcomeBanner';

describe('IngestOutcomeBanner', () => {
  it('shows an explicit success message without a CTA for zero modules', () => {
    render(
      <IngestOutcomeBanner
        status="succeeded"
        generatedModuleCount={0}
        onGoToDrafts={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'Ingestion completed, but no modules were generated from this ingestion.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Go to Drafts' }),
    ).not.toBeInTheDocument();
  });

  it.each(['succeeded', 'partially_succeeded'])(
    'shows the CTA for %s ingestion when modules were generated',
    async (status) => {
      const user = userEvent.setup();
      const onGoToDrafts = vi.fn();
      render(
        <IngestOutcomeBanner
          status={status}
          generatedModuleCount={1}
          onGoToDrafts={onGoToDrafts}
        />,
      );

      expect(
        screen.getByText(
          'Ingestion generated draft modules. Review them or start another ingestion.',
        ),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Go to Drafts' }));

      expect(onGoToDrafts).toHaveBeenCalledOnce();
    },
  );

  it.each([0, 2])(
    'renders no success outcome for a failed ingestion reporting %i modules',
    (generatedModuleCount) => {
      const { container } = render(
        <IngestOutcomeBanner
          status="failed"
          generatedModuleCount={generatedModuleCount}
          onGoToDrafts={vi.fn()}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    },
  );
});
