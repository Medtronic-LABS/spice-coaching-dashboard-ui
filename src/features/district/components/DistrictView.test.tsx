import { render, screen } from '@testing-library/react';
import { DistrictView } from './DistrictView';

describe('DistrictView', () => {
  it('renders correctly', () => {
    render(<DistrictView />);
    expect(
      screen.getByRole('heading', { name: /district view/i }),
    ).toBeInTheDocument();
  });
});
