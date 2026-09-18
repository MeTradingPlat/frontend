import { Injectable, inject } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { LogApiService } from './log-api.service';
import { NotificacionSseService } from './notificacion-sse.service';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';

interface SignalRow {
  id: number;
  // Posicion cronologica (1 = primera senal del dia, crece con cada una
  // nueva) -- calculada desde el total real que da el backend (ver
  // numeroBase en _logsToSignals), no un contador local.
  numero: number;
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

  private readonly liveSignalsSub = new Map<number, Subscription>();
  private readonly liveSignalsLastRequest = new Map<number, {
    fecha: string; page: number; pageSize: number; onResult: (signals: SignalRow[], totalElements: number) => void;
  }>();

  // "Hoy" con paginador real (igual que loadSignalsForDate, mismo endpoint de
  // conteo) en vez de traer hasta 15000 filas de una -- antes un escaner sin
  // pre-filtros (ej. universo completo) podia acumular miles de senales en
  // un dia y el tab las cargaba TODAS al abrir. Ahora solo pide la pagina
  // pedida (50 por defecto), y una senal nueva por SSE solo dispara un
  // refresco silencioso si el que mira esta tab sigue en la pagina 0 (la mas
  // reciente) -- si ya avanzo de pagina, una senal nueva no lo saca de ahi.
  loadSignalsLive(
    scannerId: number,
    fecha: string,
    page: number,
    pageSize: number,
    onResult: (signals: SignalRow[], totalElements: number) => void
  ): void {
    this.liveSignalsLastRequest.set(scannerId, { fecha, page, pageSize, onResult });
    this.loadSignalsForDate(scannerId, fecha, page, pageSize, onResult);

    if (!this.liveSignalsSub.has(scannerId)) {
      const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
        next: (n: { categoria?: string }) => {
          if (n.categoria !== 'SIGNAL') return;
          const last = this.liveSignalsLastRequest.get(scannerId);
          if (last && last.page === 0) {
            this.loadSignalsForDate(scannerId, last.fecha, last.page, last.pageSize, last.onResult);
          }
        }
      });
      this.liveSignalsSub.set(scannerId, sub);
    }
  }

  releaseLiveSignals(scannerId: number): void {
    this.liveSignalsSub.get(scannerId)?.unsubscribe();
    this.liveSignalsSub.delete(scannerId);
    this.liveSignalsLastRequest.delete(scannerId);
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

  private extractTipo(mensaje: string): string {
    if (mensaje.toLowerCase().includes('entrada')) return 'ENTRADA';
    if (mensaje.toLowerCase().includes('salida')) return 'SALIDA';
    if (mensaje.toLowerCase().includes('generada')) return 'NUEVA';
    return 'SIGNAL';
  }
}