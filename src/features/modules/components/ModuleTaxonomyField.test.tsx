import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleTaxonomyField } from './ModuleTaxonomyField';

describe('ModuleTaxonomyField', () => {
  it('shows a text input when there are no existing options', () => {
    render(
      <ModuleTaxonomyField
        label="Domain"
        value=""
        options={[]}
        placeholder="rmnch"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^domain$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('rmnch')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('lists existing options and supports entering a new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ModuleTaxonomyField
        label="Domain"
        value=""
        options={['rmnch', 'clinical']}
        onChange={onChange}
      />,
    );

    const select = screen.getByLabelText(/^domain$/i);
    expect(select).toHaveClass('select-arrow');
    expect(screen.getByRole('option', { name: 'RMNCH' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Clinical' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Enter new…' }),
    ).toBeInTheDocument();

    await user.selectOptions(select, 'rmnch');
    expect(onChange).toHaveBeenLastCalledWith('rmnch');

    onChange.mockClear();
    await user.selectOptions(select, '__other__');
    expect(onChange).toHaveBeenLastCalledWith('');

    const customInput = screen.getByLabelText(/^new domain$/i);
    await user.type(customInput, 'Hypertension');
    expect(onChange.mock.calls.map(([value]) => value).join('')).toBe(
      'Hypertension',
    );
  });

  it('marks the field as required when requested', () => {
    render(
      <ModuleTaxonomyField
        label="Domain"
        value=""
        options={['rmnch']}
        required
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/domain/i)).toBeRequired();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
