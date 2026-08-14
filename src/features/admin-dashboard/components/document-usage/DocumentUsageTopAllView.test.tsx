import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocumentUsageTopAllView } from '@/features/admin-dashboard/components/document-usage/DocumentUsageTopAllView';
import { renderWithProviders } from '@/test-utils/render';

const LONG_DOCUMENT_TITLE =
  'Community health worker counselling guide with a very long document title for dashboard truncation';

describe('DocumentUsageTopAllView', () => {
  it('renders document titles with truncated text styling', () => {
    renderWithProviders(
      <DocumentUsageTopAllView
        topDocuments={[
          {
            id: 'doc-1',
            rank: 1,
            title: LONG_DOCUMENT_TITLE,
            views: 42,
            uniqueUsers: 12,
            percent: 100,
          },
        ]}
      />,
    );

    const content = screen.getByText(LONG_DOCUMENT_TITLE);
    expect(content).toHaveClass('truncate');
    expect(
      screen.getByRole('columnheader', { name: 'Document' }),
    ).toBeInTheDocument();
  });
});
