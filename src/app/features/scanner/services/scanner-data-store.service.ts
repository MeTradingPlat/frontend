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

  // Busqueda por simbolo en TODO el historial (no solo la pagina/fecha
  // actual) -- paginada igual que loadSignalsForDate, pero contra el
  // endpoint /buscar del backend en vez de /count+fecha.
  searchSignals(
    scannerId: number,
    simbolo: string,
    page: number,
    pageSize: number,
    onResult: (signals: SignalRow[], totalElements: number) => void
  ): void {
    forkJoin({
      logs: this.logApi.buscarPorEscanerYSimbolo(scannerId, simbolo, page, pageSize),
      total: this.logApi.contarPorEscanerYSimbolo(scannerId, simbolo)
    }).subscribe(({ logs, total }) => {
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

  private readonly liveRegistrySub = new Map<number, Subscription>();
  private readonly liveRegistryLastRequest = new Map<number, {
    fecha: string; page: number; pageSize: number; onResult: (logs: RegistroLogDTORespuesta[], totalElements: number) => void;
  }>();

  // Mismo patron que loadSignalsLive: "hoy" pagina de verdad (50 por pagina)
  // en vez de acumular con "cargar mas". Aqui SI se refresca con cualquier
  // categoria de log (no solo SIGNAL), porque el registro muestra todos los
  // tipos de evento.
  loadRegistryLive(
    scannerId: number,
    logApi: LogApiService,
    fecha: string,
    page: number,
    pageSize: number,
    onResult: (logs: RegistroLogDTORespuesta[], totalElements: number) => void
  ): void {
    this.liveRegistryLastRequest.set(scannerId, { fecha, page, pageSize, onResult });
    this.loadLogsForDate(scannerId, logApi, fecha, page, pageSize, onResult);

    if (!this.liveRegistrySub.has(scannerId)) {
      const sub = this.sse.conectarPorEscaner(scannerId).subscribe({
        next: () => {
          const last = this.liveRegistryLastRequest.get(scannerId);
          if (last && last.page === 0) {
            this.loadLogsForDate(scannerId, logApi, last.fecha, last.page, last.pageSize, last.onResult);
          }
        }
      });
      this.liveRegistrySub.set(scannerId, sub);
    }
  }

  releaseLiveRegistry(scannerId: number): void {
    this.liveRegistrySub.get(scannerId)?.unsubscribe();
    this.liveRegistrySub.delete(scannerId);
    this.liveRegistryLastRequest.delete(scannerId);
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

  // Igual que searchSignals pero sin filtro de categoria, para la pestana
  // "Registro".
  searchRegistry(
    scannerId: number,
    logApi: LogApiService,
    simbolo: string,
    page: number,
    pageSize: number,
    onResult: (logs: RegistroLogDTORespuesta[], totalElements: number) => void
  ): void {
    forkJoin({
      logs: logApi.buscarPorEscanerYSimboloTodas(scannerId, simbolo, page, pageSize),
      total: logApi.contarPorEscanerYSimboloTodas(scannerId, simbolo)
    }).subscribe(({ logs, total }) => onResult(logs, total));
  }

  private extractTipo(mensaje: string): string {
    if (mensaje.toLowerCase().includes('entrada')) return 'ENTRADA';
    if (mensaje.toLowerCase().includes('salida')) return 'SALIDA';
    if (mensaje.toLowerCase().includes('generada')) return 'NUEVA';
    return 'SIGNAL';
  }
}