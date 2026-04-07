import { render, screen } from '@testing-library/react';
import { Home } from '@/features/home/components/Home';

jest.mock('@/features/home/api/homeApi', () => ({
  useGetHomeStatusQuery: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
}));

describe('Home', () => {
  it('renders home heading', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });
});
