import { mergeApplicationConfig, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { join } from 'path';
import { readFileSync } from 'fs';

// Cargador de traducciones específico para el servidor (Node.js)
export class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    try {
      // Intentar varias rutas comunes en despliegues Docker de Angular
      const paths = [
        join(process.cwd(), 'dist', 'frontend', 'browser', 'assets', 'i18n', `${lang}.json`),
        join(process.cwd(), 'browser', 'assets', 'i18n', `${lang}.json`),
        join(process.cwd(), 'assets', 'i18n', `${lang}.json`)
      ];
      
      for (const p of paths) {
        try {
          const data = JSON.parse(readFileSync(p, 'utf8'));
          return of(data);
        } catch (e) { /* continuar */ }
      }
      return of({});
    } catch (e) {
      return of({});
    }
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: ServerTranslateLoader
        }
      })
    )
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
