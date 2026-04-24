import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders the welcome message', () => {
    render(<Header />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/subhodeep/i)).toBeInTheDocument();
  });

  it('renders the user menu control', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /user menu/i })).toBeVisible();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
