import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IngestFlowStatusLabel } from './IngestFlowStatusLabel';

const thumbnailFailureNode = {
  key: 'thumbnail',
  title: 'Generating thumbnail',
  status: 'failed',
  error: {
    type: 'ThumbnailJobCrashed',
    detail: 'thumbnail worker crashed',
    reason: 'thumbnail_failed',
  },
  error_code: 'thumbnail_failed',
  error_message: "We couldn't generate a preview image for this file.",
};

describe('IngestFlowStatusLabel', () => {
  it('shows top-level error_message in the info tooltip for failed nodes', () => {
    render(
      <IngestFlowStatusLabel
        status="failed"
        failureContext={thumbnailFailureNode}
      />,
    );

    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: "We couldn't generate a preview image for this file.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('thumbnail worker crashed'),
    ).not.toBeInTheDocument();
  });

  it('shows nested error.detail in the tooltip when error_message is absent', () => {
    render(
      <IngestFlowStatusLabel
        status="failed"
        failureContext={{
          status: 'failed',
          error: { details: 'Connection reset by peer' },
        }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Connection reset by peer' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });

  it('falls back to formatted API status when a failed node has no tooltip message', () => {
    render(<IngestFlowStatusLabel status="pipeline_failed" />);

    expect(screen.getByText('Pipeline Failed')).toHaveClass(
      'text-spice-semantic-error',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not show an info icon for non-failed status', () => {
    render(
      <IngestFlowStatusLabel
        status="running"
        failureContext={thumbnailFailureNode}
      />,
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows formatted status for non-failed nodes', () => {
    render(<IngestFlowStatusLabel status="succeeded" />);

    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
