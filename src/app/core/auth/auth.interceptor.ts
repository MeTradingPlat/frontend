import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // No añadir el token a la petición de login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // El token guardado quedo invalido (vencido, revocado, etc.) -- logout()
      // limpia localStorage y manda a /login en vez de dejar la pagina
      // mostrando datos viejos con las peticiones fallando en silencio.
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
