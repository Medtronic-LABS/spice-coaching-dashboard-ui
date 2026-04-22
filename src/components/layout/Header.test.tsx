import { fireEvent, render, screen } from '@testing-library/react';
import { i18n } from '@/i18n/i18n';
import type { TFunction } from 'i18next';
import { Header } from './Header';

describe('Header', () => {
  const tMock = ((key: string) => key) as unknown as TFunction;

  it('renders the header title', () => {
    render(<Header />);
    expect(
      screen.getByText('Micro-learning analytics dashboard'),
    ).toBeInTheDocument();
  });

  it('does not include Hindi in language options', () => {
    render(<Header />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.querySelector('option[value="hi"]')).toBeNull();
    expect(select.querySelector('option[value="en"]')).not.toBeNull();
    expect(select.querySelector('option[value="bn"]')).not.toBeNull();
  });

  it('changes language and persists selection to localStorage', () => {
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      .mockResolvedValue(tMock);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<Header />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bn' } });

    expect(changeLanguageSpy).toHaveBeenCalledWith('bn');
    expect(setItemSpy).toHaveBeenCalledWith('i18nLng', 'bn');
  });
});
