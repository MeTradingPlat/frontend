import { Injectable, PLATFORM_ID, inject, signal, effect, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../storage.service';
import { Theme, ThemeConfig, THEME_CONSTANTS } from './theme.types';

/**
 * Servicio para gestionar el tema de la aplicación (claro/oscuro)
 *
 * Características:
 * - Persistencia en localStorage
 * - Estado reactivo con signals
 * - SSR-safe (funciona en servidor y navegador)
 * - Detección de preferencias del sistema
 * - Aplicación automática de clases CSS
 *
 * @example
 * ```typescript
 * export class MyComponent {
 *   private themeService = inject(ThemeService);
 *
 *   currentTheme = this.themeService.theme; // Signal readonly
 *
 *   toggleTheme() {
 *     this.themeService.toggle();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Tema actual de la aplicación (readonly signal) */
  readonly theme = signal<Theme>(this.getInitialTheme());

  /** Si el tema actual es oscuro */
  readonly isDark = signal(this.theme() === 'dark');

  /** Si el tema actual es claro */
  readonly isLight = signal(this.theme() === 'light');

  constructor() {
    // Effect para sincronizar isDark/isLight cuando cambie el tema
    effect(() => {
      const currentTheme = this.theme();
      this.isDark.set(currentTheme === 'dark');
      this.isLight.set(currentTheme === 'light');
    });

    // Effect para aplicar el tema al DOM
    effect(() => {
      this.applyTheme(this.theme());
    });

    // Escuchar cambios en las preferencias del sistema (solo en browser)
    if (this.isBrowser) {
      this.listenToSystemPreference();
    }
  }

  /**
   * Cambia el tema de la aplicación
   * @param theme Nuevo tema a aplicar
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.saveThemeToStorage(theme);
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggle(): void {
    const newTheme: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Establece el tema según las preferencias del sistema
   */
  useSystemPreference(): void {
    if (!this.isBrowser) return;

    const prefersDark = window.matchMedia(THEME_CONSTANTS.DARK_MODE_QUERY).matches;
    this.setTheme(prefersDark ? 'dark' : 'light');
  }

  /**
   * Resetea el tema a los valores por defecto
   */
  reset(): void {
    this.storage.removeItem(THEME_CONSTANTS.STORAGE_KEY);
    this.setTheme(this.getSystemPreference());
  }

  /**
   * Obtiene el tema inicial al cargar la aplicación
   */
  private getInitialTheme(): Theme {
    // 1. Intentar obtener del localStorage
    const savedTheme = this.storage.getItem<Theme>(THEME_CONSTANTS.STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // 2. Usar preferencia del sistema
    return this.getSystemPreference();
  }

  /**
   * Obtiene la preferencia de tema del sistema
   */
  private getSystemPreference(): Theme {
    if (!this.isBrowser) {
      return 'light'; // Default en servidor
    }

    const prefersDark = window.matchMedia(THEME_CONSTANTS.DARK_MODE_QUERY).matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * Aplica el tema al DOM
   */
  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    const body = this.document.body;

    // Remover clases anteriores
    body.classList.remove(THEME_CONSTANTS.DARK_CLASS, THEME_CONSTANTS.LIGHT_CLASS);

    // Aplicar nueva clase
    const themeClass = theme === 'dark' ? THEME_CONSTANTS.DARK_CLASS : THEME_CONSTANTS.LIGHT_CLASS;
    body.classList.add(themeClass);

    // Opcional: también establecer atributo data-theme
    body.setAttribute('data-theme', theme);
  }

  /**
   * Guarda el tema en localStorage
   */
  private saveThemeToStorage(theme: Theme): void {
    this.storage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
  }

  /**
   * Escucha cambios en las preferencias del sistema
   */
  private listenToSystemPreference(): void {
    if (!this.isBrowser) return;

    const mediaQuery = window.matchMedia(THEME_CONSTANTS.DARK_MODE_QUERY);

    // Listener para cambios en la preferencia del sistema
    mediaQuery.addEventListener('change', (event) => {
      // Solo actualizar si no hay una preferencia guardada explícitamente
      const savedTheme = this.storage.getItem<Theme>(THEME_CONSTANTS.STORAGE_KEY);
      if (!savedTheme) {
        this.setTheme(event.matches ? 'dark' : 'light');
      }
    });
  }
}
