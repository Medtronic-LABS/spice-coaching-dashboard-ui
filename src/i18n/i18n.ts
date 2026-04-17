import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'i18nLng';

import enTranslation from '../../locales/en/translation.json';
import hiTranslation from '../../locales/hi/translation.json';
import bnTranslation from '../../locales/bn/translation.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  bn: { translation: bnTranslation },
} as const;

const getInitialLanguage = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {
    // ignore storage access failures
  }
  return 'en';
};

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi', 'bn'],
  interpolation: { escapeValue: false },
});

export { i18n };
