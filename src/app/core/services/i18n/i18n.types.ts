/**
 * Idiomas soportados por la aplicación
 */
export type SupportedLocale = 'es' | 'en';

/**
 * Información de un idioma
 */
export interface LocaleInfo {
  /** Código del idioma (es, en) */
  code: SupportedLocale;
  /** Nombre del idioma en su propio idioma */
  name: string;
  /** Nombre del idioma en inglés */
  englishName: string;
  /** Icono o flag del idioma */
  flag: string;
}

/**
 * Configuración de idiomas disponibles
 */
export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleInfo> = {
  es: {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸'
  },
  en: {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇺🇸'
  }
} as const;

/**
 * Constantes relacionadas con i18n
 */
export const I18N_CONSTANTS = {
  /** Clave para guardar el idioma en localStorage */
  STORAGE_KEY: 'app-locale',
  /** Idioma por defecto */
  DEFAULT_LOCALE: 'es' as SupportedLocale,
  /** Prefijo para rutas localizadas */
  LOCALE_PREFIX: 'locale'
} as const;
