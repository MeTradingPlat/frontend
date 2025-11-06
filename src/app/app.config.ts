import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom, PLATFORM_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi, HttpClient, HttpBackend } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Custom TranslateLoader que funciona en SSR y evita el circular dependency
export class BrowserTranslateLoader implements TranslateLoader {
  private http: HttpClient;
  private platformId: any;

  constructor(httpBackend: HttpBackend) {
    // Usar HttpBackend en lugar de HttpClient para evitar el circular dependency con interceptors
    this.http = new HttpClient(httpBackend);
    this.platformId = inject(PLATFORM_ID);
  }

  getTranslation(lang: string): Observable<any> {
    // Solo cargar traducciones en el navegador
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(`/app/assets/i18n/${lang}.json`);
    }
    // En el servidor, retornar objeto vacío
    return of({});
  }
}

// Factory function
export function HttpLoaderFactory(httpBackend: HttpBackend) {
  return new BrowserTranslateLoader(httpBackend);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([languageInterceptor])
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpBackend]
        }
      })
    )
  ]
};
