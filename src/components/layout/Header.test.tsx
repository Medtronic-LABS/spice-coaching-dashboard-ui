import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders the header title', () => {
    render(<Header />);
    expect(
      screen.getByText('Micro Learning Analytics Dashboard'),
    ).toBeInTheDocument();
  });
});
