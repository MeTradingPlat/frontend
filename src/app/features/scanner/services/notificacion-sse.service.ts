import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificacionDTORespuesta } from '../models/notificacion.interface';

/**
 * Servicio SSE para Notificaciones en tiempo real.
 * Conecta con notification-service via Server-Sent Events.
 *
 * Características:
 * - Heartbeat del servidor cada 30s mantiene la conexión viva con Cloudflare
 * - Last-Event-Id: si hay reconexión, el servidor reenvía eventos perdidos
 * - Auto-reconexión nativa del EventSource (envía Last-Event-Id automáticamente)
 * - Fallback manual si la conexión se cierra permanentemente
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionSseService {
  private readonly ngZone = inject(NgZone);
  private readonly apiUrl = `${environment.apiUrl}/notificaciones`;

  private eventSource: EventSource | null = null;
  private notificacionSubject = new Subject<NotificacionDTORespuesta>();
  private lastEventId: string | null = null;

  /**
   * Conecta al stream SSE de todas las notificaciones
   */
  conectar(): Observable<NotificacionDTORespuesta> {
    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      let url = `${this.apiUrl}/stream`;
      const params: string[] = [];
      if (this.lastEventId) {
        params.push(`lastEventId=${encodeURIComponent(this.lastEventId)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      this.eventSource = new EventSource(url);
      this.configurarEventSource(() => this.conectar());
    });

    return this.notificacionSubject.asObservable();
  }

  /**
   * Conecta al stream SSE filtrado por escaner
   */
  conectarPorEscaner(idEscaner: number): Observable<NotificacionDTORespuesta> {
    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      let url = `${this.apiUrl}/stream/escaner/${idEscaner}`;
      const params: string[] = [];
      if (this.lastEventId) {
        params.push(`lastEventId=${encodeURIComponent(this.lastEventId)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      this.eventSource = new EventSource(url);
      this.configurarEventSource(() => this.conectarPorEscaner(idEscaner));
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
   * Observable del stream de notificaciones
   */
  get notificaciones$(): Observable<NotificacionDTORespuesta> {
    return this.notificacionSubject.asObservable();
  }

  /**
   * Configura los handlers del EventSource.
   * - onmessage: procesa notificaciones y guarda el lastEventId
   * - onerror: deja que EventSource auto-reconecte (envía Last-Event-Id header),
   *   solo hace reconexión manual si la conexión se cerró permanentemente
   */
  private configurarEventSource(reconectarFn: () => void): void {
    if (!this.eventSource) return;

    this.eventSource.onmessage = (event) => {
      // Guardar el ID para reconexiones
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }

      this.ngZone.run(() => {
        try {
          const notificacion: NotificacionDTORespuesta = JSON.parse(event.data);
          this.notificacionSubject.next(notificacion);
        } catch (error) {
          console.error('Error parseando notificación SSE:', error);
        }
      });
    };

    this.eventSource.onerror = () => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        // Conexión cerrada permanentemente - reconexión manual con lastEventId
        console.warn('SSE conexión cerrada. Reconectando en 5s...');
        this.ngZone.run(() => {
          setTimeout(() => reconectarFn(), 5000);
        });
      }
      // Si readyState es CONNECTING, EventSource auto-reconecta
      // y envía Last-Event-Id header automáticamente
    };
  }
}
