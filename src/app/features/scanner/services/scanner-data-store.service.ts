import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogApiService } from './log-api.service';
import { NotificacionSseService } from './notificacion-sse.service';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';

interface SignalRow {
  id: number;
  timestamp: string;
  symbol: string;
  tipo: string;
  mensaje: string;
  metadatos?: string;
}

@Injectable({ providedIn: 'root' })
export class ScannerDataStore {
  private readonly logApi = inject(LogApiService);
  private readonly sse = inject(NotificacionSseService);

  private readonly signalsCache = new Map<number, {
    data: SignalRow[]; sub: Subscription; onUpdate: (signals: SignalRow[]) => void;
  }>();

  getSignals(scannerId: number): SignalRow[] | null {
    const entry = this.signalsCache.get(scannerId);
    return entry ? entry.data : null;
  }

  loadSignals(scannerId: number, onUpdate: (signals: SignalRow[]) => void, fecha?: string): void {
    if (fecha) {
      this.logApi.getLogsPorEscanerYFecha(scannerId, fecha).subscribe({
        next: (logs: RegistroLogDTORespuesta[]) => {
          onUpdate(this._logsToSignals(logs));
        }
      });
      return;
    }

    const cached = this.signalsCache.get(scannerId);
    if (cached) {
      cached.onUpdate = onUpdate;
      onUpdate(cached.data);
      return;
    }

    const hoy = this._localToday();
    this.logApi.getLogsPorEscanerYFecha(scannerId, hoy).subscribe({
      next: (logs: RegistroLogDTORespuesta[]) => {
        const signals: SignalRow[] = this._logsToSignals(logs);

        const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
          next: (n: { categoria?: string; id?: string; timestamp: string; symbol?: string; mensaje: string; metadatos?: string }) => {
            if (n.categoria === 'SIGNAL') {
              const s: SignalRow = {
                id: parseInt(n.id || '0') || 0,
                timestamp: n.timestamp,
                symbol: n.symbol || '-',
                tipo: this.extractTipo(n.mensaje),
                mensaje: n.mensaje,
                metadatos: n.metadatos
              };
              signals.unshift(s);
              if (signals.length > 50) signals.length = 50;
              const entry = this.signalsCache.get(scannerId);
              if (entry) {
                entry.data = [...signals];
                entry.onUpdate(entry.data);
              }
            }
          }
        });

        this.signalsCache.set(scannerId, { data: signals, sub, onUpdate });
        onUpdate(signals);
      }
    });
  }

  private _localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private _logsToSignals(logs: RegistroLogDTORespuesta[]): SignalRow[] {
    return logs
      .filter((l: RegistroLogDTORespuesta) => l.categoria === 'SIGNAL')
      .sort((a: RegistroLogDTORespuesta, b: RegistroLogDTORespuesta) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((l: RegistroLogDTORespuesta) => ({
        id: l.idRegistroLog,
        timestamp: l.timestamp,
        symbol: l.symbol || '-',
        tipo: this.extractTipo(l.mensaje),
        mensaje: l.mensaje,
        metadatos: l.metadatos
      }));
  }

  private logCache = new Map<number, {
    data: RegistroLogDTORespuesta[]; page: number; hasMore: boolean; sub?: Subscription;
    onUpdate: (data: RegistroLogDTORespuesta[], hasMore: boolean) => void;
  }>();

  // Mismo problema y misma solucion que loadSignals: la conexion SSE se crea
  // una sola vez por scannerId, asi que fetchPage siempre debe llamar al
  // onUpdate GUARDADO EN LA CACHE (reasignado en cada llamada a loadLogs),
  // nunca al onUpdate cerrado sobre el en el momento de creacion -- si no,
  // una instancia de componente destruida se queda "recibiendo" los refrescos
  // en vivo mientras la visible en pantalla nunca se entera.
  loadLogs(scannerId: number, logApi: LogApiService, onUpdate: (data: RegistroLogDTORespuesta[], hasMore: boolean) => void): { loadMore: () => void } {
    const size = 50;

    const fetchPage = (p: number): void => {
      logApi.getLogsPorEscanerPaginated(scannerId, p, size).subscribe({
        next: (logs: RegistroLogDTORespuesta[]) => {
          const hasMore = logs.length === size;
          const entry = this.logCache.get(scannerId);
          const data = p === 0 ? logs : [...(entry?.data || []), ...logs];
          const currentOnUpdate = entry?.onUpdate ?? onUpdate;
          this.logCache.set(scannerId, { data, page: p, hasMore, sub: entry?.sub, onUpdate: currentOnUpdate });
          currentOnUpdate(data, hasMore);
        }
      });
    };

    let entry = this.logCache.get(scannerId);
    if (entry) {
      entry.onUpdate = onUpdate;
      if (entry.page >= 0) onUpdate(entry.data, entry.hasMore);
    } else {
      entry = { data: [], page: -1, hasMore: true, onUpdate };
      this.logCache.set(scannerId, entry);
      fetchPage(0);
    }

    if (!entry.sub) {
      entry.sub = this.sse.conectarPorEscaner(scannerId).subscribe({
        next: (): void => fetchPage(0)
      });
    }

    return {
      loadMore: (): void => {
        const current = this.logCache.get(scannerId);
        fetchPage((current?.page ?? -1) + 1);
      }
    };
  }

  release(scannerId: number): void {
    const entry = this.signalsCache.get(scannerId);
    if (entry) {
      entry.sub?.unsubscribe();
      this.signalsCache.delete(scannerId);
    }
  }

  private extractTipo(mensaje: string): string {
    if (mensaje.toLowerCase().includes('entrada')) return 'ENTRADA';
    if (mensaje.toLowerCase().includes('salida')) return 'SALIDA';
    if (mensaje.toLowerCase().includes('generada')) return 'NUEVA';
    return 'SIGNAL';
  }
}