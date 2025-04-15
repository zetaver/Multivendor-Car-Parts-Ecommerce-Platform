import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

// Log the browser language for debugging
console.log('Browser language:', navigator.language);
console.log('Browser languages:', navigator.languages);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      fr: {
        translation: frTranslations
      }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng) => lng.split('-')[0]
    },
    debug: true
  });

// Clear any previously stored language preference for testing
// Uncomment this line to force fresh language detection
// localStorage.removeItem('i18nextLng');

// Set initial HTML lang attribute
document.documentElement.setAttribute('lang', i18n.language);

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  document.documentElement.setAttribute('lang', lng);
});

// Log current language after initialization
console.log('i18n initialized with language:', i18n.language);

export default i18n;