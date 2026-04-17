import { useTranslation } from 'react-i18next';
import { i18n } from '@/i18n/i18n';
import { LANGUAGE_OPTIONS } from '@/i18n/languageOptions';

const STORAGE_KEY = 'i18nLng';

export const Header = () => {
  const { t } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    void i18n.changeLanguage(lng);
    try {
      window.localStorage.setItem(STORAGE_KEY, lng);
    } catch {
      // ignore storage access failures
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          {t('app.title')}
        </h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="sr-only">{t('layout.header.languageSelectSr')}</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            aria-label={t('layout.header.languageAriaLabel')}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
};
