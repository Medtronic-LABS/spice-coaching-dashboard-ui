import { render, screen } from '@testing-library/react';
import { AlertsView } from './AlertsView';

describe('AlertsView', () => {
  it('renders correctly', () => {
    render(<AlertsView />);
    expect(
      screen.getByRole('heading', { name: /alerts view/i }),
    ).toBeInTheDocument();
  });
});
