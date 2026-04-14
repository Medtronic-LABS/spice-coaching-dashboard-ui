import { render, screen } from '@testing-library/react';
import { CHWView } from './CHWView';

describe('CHWView', () => {
  it('renders correctly', () => {
    render(<CHWView />);
    expect(
      screen.getByRole('heading', { name: /chw view/i }),
    ).toBeInTheDocument();
  });
});
