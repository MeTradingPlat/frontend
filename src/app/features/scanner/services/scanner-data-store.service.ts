import { Injectable, inject } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { LogApiService } from './log-api.service';
import { NotificacionSseService } from './notificacion-sse.service';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';

interface SignalRow {
  id: number;
  // Posicion cronologica (1 = primera senal del dia, crece con cada una
  // nueva) -- asignado una sola vez por fila y nunca recalculado, para que
  // truncar el array al superar MAX_SIGNALS no renumere las que quedan.
  numero: number;
  timestamp: string;
  symbol: string;
  tipo: string;
  mensaje: string;
  metadatos?: string;
}

// Con 50, el primer lote de un escaner recien iniciado quedaba fuera de la
// ventana visible: el tab mostraba como "primeras" senales las de ~20 min
// despues del arranque (confirmado en vivo el 2026-08-24: 169 senales a las
// 12:29:03, el tab solo mostraba desde las 12:49). El limite sigue acotado
// para no renderizar listas gigantes.
const MAX_SIGNALS = 200;

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

  // Solo para "hoy" (SSE en vivo + cache) -- una fecha pasada usa
  // loadSignalsForDate, que si pagina de verdad con un total real.
  loadSignals(scannerId: number, onUpdate: (signals: SignalRow[]) => void): void {
    const cached = this.signalsCache.get(scannerId);
    if (cached) {
      cached.onUpdate = onUpdate;
      onUpdate(cached.data);
      return;
    }

    const hoy = this._localToday();
    this.logApi.getLogsPorEscanerYFecha(scannerId, hoy, 0, MAX_SIGNALS).subscribe({
      next: (logs: RegistroLogDTORespuesta[]) => {
        const signals: SignalRow[] = this._logsToSignals(logs);
        let totalCount = signals.length;

        const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
          next: (n: { categoria?: string; id?: string; timestamp: string; symbol?: string; mensaje: string; metadatos?: string }) => {
            if (n.categoria === 'SIGNAL') {
              totalCount++;
              const s: SignalRow = {
                id: parseInt(n.id || '0') || 0,
                numero: totalCount,
                timestamp: n.timestamp,
                symbol: n.symbol || '-',
                tipo: this.extractTipo(n.mensaje),
                mensaje: n.mensaje,
                metadatos: n.metadatos
              };
              signals.unshift(s);
              if (signals.length > MAX_SIGNALS) signals.length = MAX_SIGNALS;
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

  // Fecha pasada = foto fija: a diferencia de "hoy" (SSE en vivo, sin total
  // fijo que mostrar), tiene sentido un paginador real con numero de pagina
  // y salto directo (contarSenialesPorEscanerYFecha da el total exacto).
  loadSignalsForDate(
    scannerId: number,
    fecha: string,
    page: number,
    pageSize: number,
    onResult: (signals: SignalRow[], totalElements: number) => void
  ): void {
    forkJoin({
      logs: this.logApi.getLogsPorEscanerYFecha(scannerId, fecha, page, pageSize),
      total: this.logApi.contarSenialesPorEscanerYFecha(scannerId, fecha)
    }).subscribe(({ logs, total }) => {
      // numeroBase = numero de la primera fila (la mas reciente) de ESTA
      // pagina -- sin esto cada pagina renumeraria desde su propio tamano
      // (1..50 en todas), en vez de la posicion cronologica real del dia.
      const numeroBase = total - page * pageSize;
      onResult(this._logsToSignals(logs, numeroBase), total);
    });
  }

  private _localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private _logsToSignals(logs: RegistroLogDTORespuesta[], numeroBase?: number): SignalRow[] {
    const sorted = logs
      .filter((l: RegistroLogDTORespuesta) => l.categoria === 'SIGNAL')
      .sort((a: RegistroLogDTORespuesta, b: RegistroLogDTORespuesta) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // sorted[0] es la mas reciente -- numero cuenta desde la primera del lote
    // (indice mas alto) hacia la mas reciente (numero = base).
    const base = numeroBase ?? sorted.length;
    return sorted.map((l: RegistroLogDTORespuesta, i: number) => ({
      id: l.idRegistroLog,
      numero: base - i,
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
  // Solo para "hoy" (SSE en vivo + cargar mas) -- una fecha pasada usa
  // loadLogsForDate, que si pagina de verdad con un total real.
  loadLogs(scannerId: number, logApi: LogApiService, onUpdate: (data: RegistroLogDTORespuesta[], hasMore: boolean) => void): { loadMore: () => void } {
    const size = 50;

    // Sin esto, "Hoy" pedia los ultimos N logs sin acotar por fecha -- si el
    // escaner no habia generado nada todavia hoy, esos "ultimos N" terminaban
    // siendo literalmente los mismos del dia mas reciente con actividad,
    // mostrando exactamente lo mismo que elegir esa fecha a mano.
    const hoy = this._localToday();
    const fetchPage = (p: number): void => {
      logApi.getRegistroPorEscanerTodas(scannerId, p, size, hoy).subscribe({
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

  // Igual razon que loadSignalsForDate: fecha pasada = foto fija, paginador
  // real con total en vez de "cargar mas" acumulando paginas.
  loadLogsForDate(
    scannerId: number,
    logApi: LogApiService,
    fecha: string,
    page: number,
    pageSize: number,
    onResult: (logs: RegistroLogDTORespuesta[], totalElements: number) => void
  ): void {
    forkJoin({
      logs: logApi.getRegistroPorEscanerTodas(scannerId, page, pageSize, fecha),
      total: logApi.contarRegistrosPorEscanerYFecha(scannerId, fecha)
    }).subscribe(({ logs, total }) => onResult(logs, total));
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