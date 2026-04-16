import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiPreviewPage } from './UiPreviewPage';

describe('UiPreviewPage', () => {
  it('renders and supports resetting filters', () => {
    render(<UiPreviewPage />);

    expect(screen.getByText(/ui components preview/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/region filter/i), {
      target: { value: 'north' },
    });
    fireEvent.change(screen.getByPlaceholderText(/search chw or district/i), {
      target: { value: 'x' },
    });

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByPlaceholderText(/search chw or district/i)).toHaveValue(
      '',
    );
    expect(screen.getByLabelText(/region filter/i)).toHaveValue('all');
  });

  it('switches tabs', () => {
    render(<UiPreviewPage />);
    fireEvent.click(screen.getByRole('tab', { name: /details/i }));
    expect(screen.getByText(/active tab: details/i)).toBeInTheDocument();
  });
});
