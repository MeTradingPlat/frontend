import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogApiService } from './log-api.service';
import { NotificacionSseService } from './notificacion-sse.service';
import { ActivoApiService } from './activo-api.service';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';
import { Activo } from '../models/activo.interface';

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

  private readonly signalsCache = new Map<number, { data: SignalRow[]; sub: Subscription }>();

  getSignals(scannerId: number): SignalRow[] | null {
    const entry = this.signalsCache.get(scannerId);
    return entry ? entry.data : null;
  }

  loadSignals(scannerId: number, onUpdate: (signals: SignalRow[]) => void): void {
    if (this.signalsCache.has(scannerId)) {
      const cached = this.signalsCache.get(scannerId);
      if (cached) onUpdate(cached.data);
      return;
    }

    this.logApi.getLogsPorEscaner(scannerId).subscribe({
      next: (logs: RegistroLogDTORespuesta[]) => {
        const signals: SignalRow[] = logs
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

        const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
          next: (n: { categoria?: string; id?: string; timestamp: string; symbol?: string; mensaje: string }) => {
            if (n.categoria === 'SIGNAL') {
              const s: SignalRow = {
                id: parseInt(n.id || '0') || 0,
                timestamp: n.timestamp,
                symbol: n.symbol || '-',
                tipo: this.extractTipo(n.mensaje),
                mensaje: n.mensaje
              };
              signals.unshift(s);
              if (signals.length > 50) signals.length = 50;
              const existing = this.signalsCache.get(scannerId);
              this.signalsCache.set(scannerId, { data: [...signals], sub: existing?.sub ?? sub });
              onUpdate([...signals]);
            }
          }
        });

        this.signalsCache.set(scannerId, { data: signals, sub });
        onUpdate(signals);
      }
    });
  }

  private assetCaches = new Map<number, { data: Activo[]; sub?: Subscription }>();

  loadAssets(scannerId: number, activoApi: ActivoApiService, onUpdate: (data: Activo[]) => void): void {
    const cached = this.assetCaches.get(scannerId);
    if (cached) {
      onUpdate(cached.data);
      return;
    }

    const fetchAndUpdate = (): void => {
      activoApi.getActivosPorEscaner(scannerId).subscribe({
        next: (activos: Activo[]) => {
          const existing = this.assetCaches.get(scannerId);
          this.assetCaches.set(scannerId, { data: activos, sub: existing?.sub });
          onUpdate(activos);
        }
      });
    };

    fetchAndUpdate();

    const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
      next: (notificacion: { categoria?: string; tipo?: string }) => {
        if (notificacion.categoria === 'SIGNAL' || notificacion.tipo === 'LOG') {
          fetchAndUpdate();
        }
      }
    });

    this.assetCaches.set(scannerId, { data: [], sub });
  }

  private logCache = new Map<number, { data: RegistroLogDTORespuesta[]; page: number; hasMore: boolean; sub?: Subscription }>();

  loadLogs(scannerId: number, logApi: LogApiService, onUpdate: (data: RegistroLogDTORespuesta[], hasMore: boolean) => void): { loadMore: () => void } {
    let page = 0;
    const size = 50;

    const fetchPage = (p: number): void => {
      logApi.getLogsPorEscanerPaginated(scannerId, p, size).subscribe({
        next: (logs: RegistroLogDTORespuesta[]) => {
          const hasMore = logs.length === size;
          if (p === 0) {
            this.logCache.set(scannerId, { data: logs, page: p, hasMore, sub: this.logCache.get(scannerId)?.sub! });
            onUpdate(logs, hasMore);
          } else {
            const existing = this.logCache.get(scannerId);
            const merged = [...(existing?.data || []), ...logs];
            this.logCache.set(scannerId, { data: merged, page: p, hasMore, sub: existing?.sub! });
            onUpdate(merged, hasMore);
          }
        }
      });
    };

    const existing = this.logCache.get(scannerId);
    if (existing && existing.page >= 0) {
      onUpdate(existing.data, existing.hasMore);
    } else {
      fetchPage(0);
    }

    if (!this.logCache.has(scannerId)) {
      const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
        next: (): void => { page = 0; fetchPage(0); }
      });
      this.logCache.set(scannerId, { data: [], page: -1, hasMore: true, sub });
    }

    return {
      loadMore: (): void => {
        page++;
        fetchPage(page);
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