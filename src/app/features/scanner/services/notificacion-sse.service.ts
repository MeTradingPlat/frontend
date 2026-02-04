import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificacionDTORespuesta } from '../models/notificacion.interface';

/**
 * Servicio SSE para Notificaciones en tiempo real
 * Conecta con notification-service via Server-Sent Events
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionSseService {
  private readonly ngZone = inject(NgZone);
  private readonly apiUrl = `${environment.apiUrl}/notificaciones`;

  private eventSource: EventSource | null = null;
  private notificacionSubject = new Subject<NotificacionDTORespuesta>();

  /**
   * Conecta al stream SSE de todas las notificaciones
   */
  conectar(): Observable<NotificacionDTORespuesta> {
    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      this.eventSource = new EventSource(`${this.apiUrl}/stream`);

      this.eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const notificacion: NotificacionDTORespuesta = JSON.parse(event.data);
            this.notificacionSubject.next(notificacion);
          } catch (error) {
            console.error('Error parseando notificación SSE:', error);
          }
        });
      };

      this.eventSource.onerror = (error) => {
        console.error('Error en conexión SSE:', error);
        this.ngZone.run(() => {
          this.reconectar();
        });
      };
    });

    return this.notificacionSubject.asObservable();
  }

  /**
   * Conecta al stream SSE filtrado por escaner
   */
  conectarPorEscaner(idEscaner: number): Observable<NotificacionDTORespuesta> {
    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      this.eventSource = new EventSource(`${this.apiUrl}/stream/escaner/${idEscaner}`);

      this.eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const notificacion: NotificacionDTORespuesta = JSON.parse(event.data);
            this.notificacionSubject.next(notificacion);
          } catch (error) {
            console.error('Error parseando notificación SSE:', error);
          }
        });
      };

      this.eventSource.onerror = (error) => {
        console.error('Error en conexión SSE:', error);
        this.ngZone.run(() => {
          this.reconectarPorEscaner(idEscaner);
        });
      };
    });

    return this.notificacionSubject.asObservable();
  }

  /**
   * Desconecta el stream SSE
   */
  desconectar(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Reconecta automáticamente después de un error
   */
  private reconectar(): void {
    setTimeout(() => {
      console.log('Reconectando SSE...');
      this.conectar();
    }, 5000);
  }

  /**
   * Reconecta automáticamente para un escaner específico
   */
  private reconectarPorEscaner(idEscaner: number): void {
    setTimeout(() => {
      console.log(`Reconectando SSE para escaner ${idEscaner}...`);
      this.conectarPorEscaner(idEscaner);
    }, 5000);
  }

  /**
   * Observable del stream de notificaciones
   */
  get notificaciones$(): Observable<NotificacionDTORespuesta> {
    return this.notificacionSubject.asObservable();
  }
}
