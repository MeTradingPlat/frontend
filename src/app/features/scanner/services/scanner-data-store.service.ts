import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogApiService } from './log-api.service';
import { NotificacionSseService } from './notificacion-sse.service';

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

  getSignals(scannerId: number) {
    const entry = this.signalsCache.get(scannerId);
    if (entry) return entry.data;
    return null;
  }

  loadSignals(scannerId: number, onUpdate: (signals: SignalRow[]) => void): void {
    if (this.signalsCache.has(scannerId)) {
      onUpdate(this.signalsCache.get(scannerId)!.data);
      return;
    }

    this.logApi.getLogsPorEscaner(scannerId).subscribe({
      next: (logs) => {
        const signals = logs
          .filter(l => l.categoria === 'SIGNAL')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map(l => ({
            id: l.idRegistroLog,
            timestamp: l.timestamp,
            symbol: l.symbol || '-',
            tipo: this.extractTipo(l.mensaje),
            mensaje: l.mensaje,
            metadatos: l.metadatos
          }));

        const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
          next: (n) => {
            if (n.categoria === 'SIGNAL') {
              const s: SignalRow = {
                id: parseInt(n.id) || 0,
                timestamp: n.timestamp,
                symbol: n.symbol || '-',
                tipo: this.extractTipo(n.mensaje),
                mensaje: n.mensaje
              };
              signals.unshift(s);
              if (signals.length > 50) signals.length = 50;
              this.signalsCache.set(scannerId, { data: [...signals], sub: entry?.sub! });
              onUpdate([...signals]);
            }
          }
        });

        this.signalsCache.set(scannerId, { data: signals, sub });
        onUpdate(signals);
      }
    });
  }

  private genericCache = new Map<string, { data: any; sub?: Subscription }>();

  loadGeneric(key: string, fetch: () => Subscription, onUpdate: (data: any) => void): void {
    const cached = this.genericCache.get(key);
    if (cached) {
      onUpdate(cached.data);
      return;
    }
    const sub = fetch();
    this.genericCache.set(key, { data: null, sub });
    const checkData = () => {
      const c = this.genericCache.get(key);
      if (c?.data) onUpdate(c.data);
    };
    setTimeout(checkData, 100);
  }

  cacheGeneric(key: string, data: any): void {
    const existing = this.genericCache.get(key);
    if (existing) {
      this.genericCache.set(key, { data, sub: existing.sub });
    } else {
      this.genericCache.set(key, { data });
    }
  }

  release(scannerId: number): void {
    const entry = this.signalsCache.get(scannerId);
    if (entry) {
      entry.sub?.unsubscribe();
      this.signalsCache.delete(scannerId);
    }
    for (const [key, val] of this.genericCache) {
      if (key.startsWith(`${scannerId}:`)) {
        val.sub?.unsubscribe();
        this.genericCache.delete(key);
      }
    }
  }

  private extractTipo(mensaje: string): string {
    if (mensaje.toLowerCase().includes('entrada')) return 'ENTRADA';
    if (mensaje.toLowerCase().includes('salida')) return 'SALIDA';
    if (mensaje.toLowerCase().includes('generada')) return 'NUEVA';
    return 'SIGNAL';
  }
}