import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let apiError: ApiError;

      // Si el backend envía un error estructurado con 'codigo'
      if (error.error && error.error.codigo) {
        const backendError = error.error;
        apiError = {
          codigoError: backendError.codigo,
          mensaje: backendError.mensaje,
          codigoHttp: backendError.codigoHttp || error.status,
          url: backendError.url || error.url || '',
          metodo: backendError.metodo || req.method
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
      notificationService.error(apiError.mensaje);

      console.error('Error HTTP interceptado:', apiError);

      return throwError(() => apiError);
    })
  );
};
