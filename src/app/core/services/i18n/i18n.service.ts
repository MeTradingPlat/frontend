import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../storage.service';
import { SupportedLocale, LocaleInfo, SUPPORTED_LOCALES, I18N_CONSTANTS } from './i18n.types';

/**
 * Servicio para gestionar la internacionalización (i18n) de la aplicación
 * Usa @ngx-translate/core para permitir cambio de idioma sin recarga
 *
 * Características:
 * - Persistencia en localStorage
 * - Estado reactivo con signals
 * - SSR-safe (funciona en servidor y navegador)
 * - Cambio de idioma SIN recarga de página
 * - Detección de idioma del navegador
 *
 * @example
 * ```typescript
 * export class MyComponent {
 *   private i18nService = inject(I18nService);
 *
 *   currentLocale = this.i18nService.currentLocale; // Signal readonly
 *   availableLocales = this.i18nService.availableLocales; // Signal readonly
 *
 *   changeLanguage() {
 *     this.i18nService.setLocale('en');
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly storage = inject(StorageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Idioma actual de la aplicación (readonly signal) */
  readonly currentLocale = signal<SupportedLocale>(this.getInitialLocale());

  /** Información del idioma actual */
  readonly currentLocaleInfo = computed<LocaleInfo>(() => {
    return SUPPORTED_LOCALES[this.currentLocale()];
  });

  /** Lista de idiomas disponibles */
  readonly availableLocales = signal<LocaleInfo[]>(Object.values(SUPPORTED_LOCALES));

  /** Si el idioma actual es español */
  readonly isSpanish = computed(() => this.currentLocale() === 'es');

  /** Si el idioma actual es inglés */
  readonly isEnglish = computed(() => this.currentLocale() === 'en');

  constructor() {
    // Configurar idiomas disponibles
    this.translate.addLangs(Object.keys(SUPPORTED_LOCALES));
    this.translate.setDefaultLang(I18N_CONSTANTS.DEFAULT_LOCALE);

    // Establecer el idioma inicial
    const initialLocale = this.getInitialLocale();

    // Solo usar translate en el navegador
    if (this.isBrowser) {
      this.translate.use(initialLocale).subscribe();
    }

    this.currentLocale.set(initialLocale);
  }

  /**
   * Cambia el idioma de la aplicación
   * IMPORTANTE: Con @ngx-translate NO necesita recargar la página
   * @param locale Nuevo idioma a aplicar
   */
  setLocale(locale: SupportedLocale): void {
    // Guardar el nuevo idioma
    this.saveLocaleToStorage(locale);

    // Cambiar el idioma en TranslateService (solo en navegador)
    if (this.isBrowser) {
      // Esperar a que las traducciones se carguen antes de actualizar el signal
      this.translate.use(locale).subscribe(() => {
        // Actualizar el signal después de que las traducciones se hayan cargado
        this.currentLocale.set(locale);
      });
    } else {
      // En el servidor, actualizar directamente
      this.currentLocale.set(locale);
    }
  }

  /**
   * Alterna entre los idiomas disponibles
   */
  toggle(): void {
    const newLocale: SupportedLocale = this.currentLocale() === 'es' ? 'en' : 'es';
    this.setLocale(newLocale);
  }

  /**
   * Establece el idioma según las preferencias del navegador
   */
  useBrowserPreference(): void {
    const browserLocale = this.getBrowserLocale();
    this.setLocale(browserLocale);
  }

  /**
   * Resetea el idioma a los valores por defecto
   */
  reset(): void {
    this.storage.removeItem(I18N_CONSTANTS.STORAGE_KEY);
    this.setLocale(I18N_CONSTANTS.DEFAULT_LOCALE);
  }

  /**
   * Obtiene el código de idioma actual
   * @returns El código de idioma actual (ej: 'es', 'en')
   */
  getCurrentLanguage(): string {
    return this.currentLocale();
  }

  /**
   * Obtiene el idioma inicial al cargar la aplicación
   */
  private getInitialLocale(): SupportedLocale {
    // 1. Intentar obtener del localStorage
    const savedLocale = this.storage.getItem<SupportedLocale>(I18N_CONSTANTS.STORAGE_KEY);
    if (this.isValidLocale(savedLocale)) {
      return savedLocale;
    }

    // 2. Usar idioma por defecto (español)
    // NO detectar idioma del navegador automáticamente
    return I18N_CONSTANTS.DEFAULT_LOCALE;
  }

  /**
   * Obtiene la preferencia de idioma del navegador
   */
  private getBrowserLocale(): SupportedLocale {
    if (!this.isBrowser) {
      return I18N_CONSTANTS.DEFAULT_LOCALE;
    }

    const browserLang = navigator.language.split('-')[0] as SupportedLocale;
    return this.isValidLocale(browserLang) ? browserLang : I18N_CONSTANTS.DEFAULT_LOCALE;
  }

  /**
   * Valida si un código de idioma es soportado
   */
  private isValidLocale(locale: string | null): locale is SupportedLocale {
    return locale !== null && Object.keys(SUPPORTED_LOCALES).includes(locale);
  }

  /**
   * Guarda el idioma en localStorage y cookie
   * La cookie permite que el servidor SSR detecte el idioma preferido
   */
  private saveLocaleToStorage(locale: SupportedLocale): void {
    this.storage.setItem(I18N_CONSTANTS.STORAGE_KEY, locale);

    // También guardar en cookie para que el servidor pueda leerlo
    if (this.isBrowser) {
      // Cookie expira en 1 año
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `app_locale=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }
}
