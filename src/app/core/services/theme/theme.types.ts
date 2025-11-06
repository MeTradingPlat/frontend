/**
 * Tipos de tema disponibles en la aplicación
 */
export type Theme = 'light' | 'dark';

/**
 * Configuración del tema
 */
export interface ThemeConfig {
  /** Tema actual */
  theme: Theme;
  /** Si se debe aplicar automáticamente según preferencias del sistema */
  useSystemPreference: boolean;
}

/**
 * Constantes relacionadas con el tema
 */
export const THEME_CONSTANTS = {
  /** Clave para guardar el tema en localStorage */
  STORAGE_KEY: 'app-theme',
  /** Clase CSS para tema oscuro */
  DARK_CLASS: 'dark-mode',
  /** Clase CSS para tema claro */
  LIGHT_CLASS: 'light-mode',
  /** Media query para detectar preferencia de sistema */
  DARK_MODE_QUERY: '(prefers-color-scheme: dark)'
} as const;
