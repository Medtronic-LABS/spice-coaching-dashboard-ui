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

  it('changes language and persists selection to localStorage', () => {
    const changeLanguageSpy = vi
      .spyOn(i18n, 'changeLanguage')
      // i18next returns a Promise-ish; we don’t need it to resolve here
      .mockResolvedValue(tMock);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<Header />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.querySelector('option[value="hi"]')).not.toBeNull();
    fireEvent.change(select, { target: { value: 'hi' } });

    expect(changeLanguageSpy).toHaveBeenCalledWith('hi');
    expect(setItemSpy).toHaveBeenCalledWith('i18nLng', 'hi');
  });

  it('does not crash if localStorage write fails', () => {
    vi.spyOn(i18n, 'changeLanguage').mockResolvedValue(tMock);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(<Header />);

    expect(() =>
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'bn' },
      }),
    ).not.toThrow();
  });
});
