import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IngestFlowStatusLabel } from './IngestFlowStatusLabel';

describe('IngestFlowStatusLabel', () => {
  it('shows only an info tooltip with the API error message for failed nodes', () => {
    const apiMessage = 'This session is provisioning a new connection';
    render(
      <IngestFlowStatusLabel
        status="failed"
        error={{
          type: 'InvalidRequestError',
          message: apiMessage,
        }}
      />,
    );

    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: apiMessage }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/InvalidRequestError/i)).not.toBeInTheDocument();
  });

  it('falls back to formatted API status when a failed node has no error message', () => {
    render(<IngestFlowStatusLabel status="pipeline_failed" />);

    expect(screen.getByText('Pipeline Failed')).toHaveClass(
      'text-spice-semantic-error',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not show an info icon when only an error payload is present', () => {
    render(
      <IngestFlowStatusLabel
        status="running"
        error={{ message: 'Something went wrong' }}
      />,
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not show an info icon when status is missing even with an error payload', () => {
    render(
      <IngestFlowStatusLabel
        status=""
        error={{ message: 'Something went wrong' }}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows formatted status for non-failed nodes', () => {
    render(<IngestFlowStatusLabel status="succeeded" />);

    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View failure message' }),
    ).not.toBeInTheDocument();
  });
});
