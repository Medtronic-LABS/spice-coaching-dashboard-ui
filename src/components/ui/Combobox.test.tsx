import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';

const OPTIONS: ComboboxOption[] = [
  { label: 'All documents', value: '' },
  { label: 'Hypertension guide', value: 'doc-1' },
  { label: 'Diabetes protocol', value: 'doc-2' },
];

interface HarnessProps {
  onChange?: (value: string) => void;
  onSearchTermChange?: (term: string) => void;
  options?: ComboboxOption[];
  isLoading?: boolean;
  hint?: string;
}

const Harness = ({
  onChange,
  onSearchTermChange,
  options = OPTIONS,
  isLoading = false,
  hint,
}: HarnessProps) => {
  const [value, setValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const selected = options.find((option) => option.value === value);
  return (
    <Combobox
      id="test-combobox"
      value={value}
      selectedLabel={selected?.label ?? ''}
      options={options}
      searchTerm={searchTerm}
      onSearchTermChange={(term) => {
        setSearchTerm(term);
        onSearchTermChange?.(term);
      }}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      isLoading={isLoading}
      hint={hint}
      emptyMessage="No matches"
    />
  );
};

describe('Combobox', () => {
  it('opens on focus and selects an option with the mouse', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await user.click(
      screen.getByRole('option', { name: 'Hypertension guide' }),
    );
    expect(onChange).toHaveBeenCalledWith('doc-1');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('Hypertension guide');
  });

  it('forwards typed text to onSearchTermChange', async () => {
    const user = userEvent.setup();
    const onSearchTermChange = vi.fn();
    render(<Harness onSearchTermChange={onSearchTermChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('dia');
    expect(onSearchTermChange).toHaveBeenLastCalledWith('dia');
  });

  it('supports keyboard navigation and selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('doc-2');
  });

  it('closes without selecting on Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the empty message when no options match', async () => {
    const user = userEvent.setup();
    render(<Harness options={[]} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows the loading row and hint while fetching', async () => {
    const user = userEvent.setup();
    render(<Harness isLoading hint="Showing 50 of 320 documents" />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByText('Showing 50 of 320 documents')).toBeInTheDocument();
  });
});
