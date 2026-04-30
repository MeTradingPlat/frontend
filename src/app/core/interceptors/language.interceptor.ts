import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nService } from '../services/i18n/i18n.service';

/**
 * Interceptor HTTP para añadir el header Accept-Language a todas las peticiones
 *
 * Automáticamente añade el idioma actual del usuario a cada petición HTTP,
 * permitiendo que el backend devuelva respuestas en el idioma correcto.
 *
 * @example
 * // En app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([languageInterceptor])
 *     )
 *   ]
 * };
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  // Omitir interceptor para traducciones y para la ruta de login
  if (req.url.includes('.json') || req.url.includes('/auth/login')) {
    return next(req);
  }

  const i18nService = inject(I18nService);
  const currentLocale = i18nService.currentLocale();

  const clonedRequest = req.clone({
    setHeaders: {
      'Accept-Language': currentLocale
    }
  });

  return next(clonedRequest);
};
