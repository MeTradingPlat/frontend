import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, EMPTY } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificacionDTORespuesta } from '../models/notificacion.interface';

/**
 * Servicio SSE para Notificaciones en tiempo real.
 * Conecta con notification-service via Server-Sent Events.
 *
 * Características:
 * - Heartbeat del servidor cada 30s mantiene la conexión viva con Cloudflare
 * - Last-Event-Id: si hay reconexión, el servidor reenvía eventos perdidos
 * - Reconexión con backoff exponencial (3s -> 6s -> 12s -> 30s max)
 * - Compatible con SSR (solo se conecta en el navegador)
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionSseService {
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/notificaciones`;

  private eventSource: EventSource | null = null;
  private notificacionSubject = new Subject<NotificacionDTORespuesta>();
  private lastEventId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly BASE_DELAY = 3000;
  private static readonly MAX_DELAY = 30000;

  /**
   * Conecta al stream SSE de todas las notificaciones
   */
  conectar(): Observable<NotificacionDTORespuesta> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      const url = this.buildUrl(`${this.apiUrl}/stream`);
      this.eventSource = new EventSource(url);
      this.configurarEventSource(() => this.conectar());
    });

    return this.notificacionSubject.asObservable();
  }

  /**
   * Conecta al stream SSE filtrado por escaner
   */
  conectarPorEscaner(idEscaner: number): Observable<NotificacionDTORespuesta> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    this.desconectar();

    this.ngZone.runOutsideAngular(() => {
      const url = this.buildUrl(`${this.apiUrl}/stream/escaner/${idEscaner}`);
      this.eventSource = new EventSource(url);
      this.configurarEventSource(() => this.conectarPorEscaner(idEscaner));
    });

    return this.notificacionSubject.asObservable();
  }

  /**
   * Desconecta el stream SSE
   */
  desconectar(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

  private buildUrl(baseUrl: string): string {
    const params: string[] = [];
    if (this.lastEventId) {
      params.push(`lastEventId=${encodeURIComponent(this.lastEventId)}`);
    }
    return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
  }

  /**
   * Calcula delay con backoff exponencial: 3s -> 6s -> 12s -> 24s -> 30s (max)
   */
  private getReconnectDelay(): number {
    const delay = Math.min(
      NotificacionSseService.BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      NotificacionSseService.MAX_DELAY
    );
    return delay;
  }

  /**
   * Configura los handlers del EventSource.
   * - onopen: resetea contador de reintentos al conectar exitosamente
   * - onmessage: procesa notificaciones y guarda el lastEventId
   * - onerror: cierra EventSource y reconecta con backoff exponencial
   */
  private configurarEventSource(reconectarFn: () => void): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
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
      // Cerrar para evitar auto-reconnect nativo del browser (sin backoff)
      this.eventSource?.close();
      this.eventSource = null;

      const delay = this.getReconnectDelay();
      this.reconnectAttempts++;
      console.warn(`SSE error. Reconectando en ${delay / 1000}s (intento ${this.reconnectAttempts})...`);

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        reconectarFn();
      }, delay);
    };
  }
}
