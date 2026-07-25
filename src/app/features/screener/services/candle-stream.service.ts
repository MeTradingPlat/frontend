import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { CandleStreamMessage } from '../models/candle.models';

/**
 * WebSocket client for live candles (marketdata-service /ws/candles).
 * Multiplexes every symbol:timeframe subscription over one shared socket,
 * mirroring the ref-counting done server-side by BaseWebSocketHandler:
 * the "unsubscribe" frame is only sent once the last local caller for a
 * given pair unsubscribes. Same reconnect-with-backoff shape as
 * NotificacionSseService, adapted from EventSource to a native WebSocket.
 */
@Injectable({
  providedIn: 'root'
})
export class CandleStreamService {
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  private socket: WebSocket | null = null;
  private readonly messageSubject = new Subject<CandleStreamMessage>();
  private readonly refCounts = new Map<string, number>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly BASE_DELAY = 3000;
  private static readonly MAX_DELAY = 30000;

  subscribe(symbol: string, timeframe: string): Observable<CandleStreamMessage> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const key = `${symbol}:${timeframe}`;
    this.ensureConnected();
    const count = (this.refCounts.get(key) ?? 0) + 1;
    this.refCounts.set(key, count);
    if (count === 1) {
      this.sendFrame('subscribe', symbol, timeframe);
    }

    return new Observable<CandleStreamMessage>(observer => {
      const subscription = this.messageSubject
        .pipe(filter(msg => msg.symbol === symbol && msg.timeframe === timeframe))
        .subscribe(observer);

      return () => {
        subscription.unsubscribe();
        const remaining = (this.refCounts.get(key) ?? 1) - 1;
        if (remaining <= 0) {
          this.refCounts.delete(key);
          this.sendFrame('unsubscribe', symbol, timeframe);
        } else {
          this.refCounts.set(key, remaining);
        }
      };
    });
  }

  private ensureConnected(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const token = this.authService.getToken();
      const url = `${environment.websocketUrl}/candles${token ? '?token=' + encodeURIComponent(token) : ''}`;
      this.socket = new WebSocket(url);
      this.configureSocket();
    });
  }

  private configureSocket(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      for (const key of this.refCounts.keys()) {
        const [symbol, timeframe] = key.split(':');
        this.sendFrame('subscribe', symbol, timeframe);
      }
    };

    this.socket.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const message: CandleStreamMessage = JSON.parse(event.data);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Error parseando mensaje del WS de velas:', error);
        }
      });
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.refCounts.size === 0) return;

      const delay = this.getReconnectDelay();
      this.reconnectAttempts++;
      console.warn(`WS de velas cerrado. Reconectando en ${delay / 1000}s...`);

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.ensureConnected();
      }, delay);
    };
  }

  private sendFrame(action: 'subscribe' | 'unsubscribe', symbol: string, timeframe: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, symbol, timeframe }));
    }
  }

  private getReconnectDelay(): number {
    return Math.min(
      CandleStreamService.BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      CandleStreamService.MAX_DELAY
    );
  }
}
