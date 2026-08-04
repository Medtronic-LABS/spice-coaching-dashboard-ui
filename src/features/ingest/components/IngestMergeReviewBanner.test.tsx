import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IngestMergeReviewBanner } from './IngestMergeReviewBanner';

describe('IngestMergeReviewBanner', () => {
  it('renders the non-dismissable warning and view details action', () => {
    const onViewDetails = vi.fn();
    render(<IngestMergeReviewBanner onViewDetails={onViewDetails} />);

    expect(
      screen.getByText(
        'Some modules require your approval before ingestion can continue.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Details' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });
});
