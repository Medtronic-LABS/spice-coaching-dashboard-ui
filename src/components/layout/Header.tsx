import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language ?? 'en';

  return (
    <header className="border-b border-slate-200 bg-white px-8 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-600">
            {t('layout.header.welcomeBack', {
              name: t('layout.header.userName'),
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="header-language-select">
            {t('layout.header.languageSelectSr')}
          </label>
          <select
            id="header-language-select"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            aria-label={t('layout.header.languageAriaLabel')}
            value={currentLanguage}
            onChange={(event) => {
              const nextLanguage = event.target.value;
              try {
                window.localStorage.setItem('i18nLng', nextLanguage);
              } catch {
                // ignore storage access failures
              }
              void i18n.changeLanguage(nextLanguage);
            }}
          >
            <option value="en">{t('layout.header.languageOptions.en')}</option>
            <option value="bn">{t('layout.header.languageOptions.bn')}</option>
          </select>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
            aria-label={t('layout.header.userMenuAriaLabel')}
          >
            {t('layout.header.userInitials')}
          </button>
        </div>
      </div>
    </header>
  );
};
