import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { ModuleTaxonomyField } from './ModuleTaxonomyField';

function LiveValueInOptionsField() {
  const catalog = ['rmnch', 'clinical'];
  const [value, setValue] = useState('');
  const options =
    value.trim() && !catalog.includes(value) ? [value, ...catalog] : catalog;

  return (
    <ModuleTaxonomyField
      label="Domain"
      value={value}
      options={options}
      onChange={setValue}
    />
  );
}

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
    expect(screen.getByPlaceholderText('rmnch')).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.taxonomy),
    );
    expect(screen.getByText(`0/${FIELD_LIMITS.taxonomy}`)).toBeInTheDocument();
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
    expect(customInput).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.taxonomy),
    );
    expect(screen.getByText(`0/${FIELD_LIMITS.taxonomy}`)).toBeInTheDocument();
    await user.type(customInput, 'Hypertension');
    expect(onChange.mock.calls.map(([value]) => value).join('')).toBe(
      'Hypertension',
    );
  });

  it('keeps the custom input while typing even if options later include the value', async () => {
    const user = userEvent.setup();

    render(<LiveValueInOptionsField />);

    await user.selectOptions(screen.getByLabelText(/^domain$/i), '__other__');
    const customInput = screen.getByLabelText(/^new domain$/i);
    await user.type(customInput, 'Hypertension');

    expect(customInput).toHaveValue('Hypertension');
    expect(screen.getByLabelText(/^domain$/i)).toHaveValue('__other__');
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

  it('hides the character counter when showCounter is false', async () => {
    const user = userEvent.setup();
    render(
      <ModuleTaxonomyField
        label="Domain"
        value=""
        options={['rmnch']}
        showCounter={false}
        onChange={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/^domain$/i), '__other__');
    expect(screen.getByLabelText(/^new domain$/i)).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.taxonomy),
    );
    expect(
      screen.queryByText(`0/${FIELD_LIMITS.taxonomy}`),
    ).not.toBeInTheDocument();
  });

  it('hides the visible label when asked and keeps an accessible name', () => {
    render(
      <ModuleTaxonomyField
        label="Domain"
        hideLabel
        value="rmnch"
        options={['rmnch']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^domain$/i)).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });
});
