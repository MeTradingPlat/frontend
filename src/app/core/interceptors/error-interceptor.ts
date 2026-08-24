import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification/notification.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // El token puede vencer con la app ya abierta (no solo al arrancarla,
      // que ya cubre AuthService.isTokenExpired) -- un 401 en cualquier
      // llamada real fuerza logout+redirect en vez de dejar al usuario
      // viendo errores sueltos por toda la app. Se excluye /auth/login para
      // no confundir credenciales invalidas con sesion vencida.
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
      }

      let apiError: ApiError;

      // Si el backend envía un error estructurado con 'codigo' (gateway
      // legacy), 'code' (marketdata-service, ej. MAINTENANCE durante el
      // refill) o 'codigoError' (scanner-management-service, RFC 7807, ej.
      // GC-0005 "No se puede guardar un escáner mientras está en ejecución")
      // -- todos se mapean al mismo ApiError. Sin 'codigoError' el mensaje
      // real del backend se perdia y el usuario veia el generico "Http
      // failure response for..." (confirmado en vivo el 2026-08-24).
      const backendError = error.error;
      const code = backendError?.codigo ?? backendError?.code ?? backendError?.codigoError;
      const message = backendError?.mensaje ?? backendError?.message;
      if (code) {
        apiError = {
          codigoError: code,
          mensaje: message,
          codigoHttp: backendError?.codigoHttp || error.status,
          url: backendError?.url || error.url || '',
          metodo: backendError?.metodo || req.method
        };
      } else if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente o de red
        apiError = {
          codigoError: 'CLIENT_ERROR',
          mensaje: error.error.message,
          codigoHttp: 0, // O un código específico para errores de cliente/red
          url: error.url || '',
          metodo: req.method
        };
      } else {
        // Error del backend sin estructura conocida o error de red
        apiError = {
          codigoError: `HTTP_${error.status}`,
          mensaje: error.message || 'Error desconocido',
          codigoHttp: error.status,
          url: error.url || '',
          metodo: req.method
        };
      }

      // Mostrar notificación
      notificationService.showError(apiError.mensaje);

      console.error('Error HTTP interceptado:', apiError);

      return throwError(() => apiError);
    })
  );
};
