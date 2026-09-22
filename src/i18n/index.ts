import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ptBR } from './locales/pt-BR';

export const SUPPORTED_LANGUAGES = ['pt-BR'] as const;
export const DEFAULT_LANGUAGE = 'pt-BR';
export const DEFAULT_NAMESPACE = 'common';

export const resources = { 'pt-BR': ptBR } as const;

/** O MVP só tem pt-BR; outro idioma do device cai no padrão. */
export function resolveLanguage(languageTag: string | null | undefined): string {
  return SUPPORTED_LANGUAGES.find((lang) => lang === languageTag) ?? DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: resolveLanguage(getLocales()[0]?.languageTag),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: Object.keys(ptBR),
    defaultNS: DEFAULT_NAMESPACE,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export { i18n };
