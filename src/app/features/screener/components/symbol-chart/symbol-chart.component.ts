import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  CandlestickData, CandlestickSeries, IChartApi, IPriceLine, ISeriesApi,
  LogicalRange, Time, createChart
} from 'lightweight-charts';
import { Subscription } from 'rxjs';
import { CandleStreamService } from '../../services/candle-stream.service';
import { ScreenerService } from '../../services/screener.service';
import { TimezoneService } from '../../../../core/services/timezone.service';
import { CandleBar, CandleStreamMessage, HistoricalCandleDTO } from '../../models/candle.models';
import { ChartDrawingManager, DrawingTool } from './drawing/chart-drawing-manager';
import { VerticalLinePrimitive } from './drawing/vertical-line-primitive';
import { PageMaintenance } from '../../../../shared/components/ui/page-maintenance/page-maintenance';

interface TimeframeOption {
  id: string;
  label: string;
}

// Mismo set de 21 timeframes que ya soportan marketdata-service y
// scanner-management-service. Se muestran 5 "principales" sueltos +
// el resto agrupado en un menu "More" (ver primaryTimeframes/moreGroups).
const TIMEFRAMES: TimeframeOption[] = [
  { id: 'M1', label: '1m' }, { id: 'M2', label: '2m' }, { id: 'M3', label: '3m' },
  { id: 'M5', label: '5m' }, { id: 'M10', label: '10m' }, { id: 'M15', label: '15m' },
  { id: 'M30', label: '30m' }, { id: 'M45', label: '45m' },
  { id: 'H1', label: '1h' }, { id: 'H2', label: '2h' }, { id: 'H3', label: '3h' },
  { id: 'H4', label: '4h' }, { id: 'H12', label: '12h' },
  { id: 'D1', label: '1d' }, { id: 'D2', label: '2d' }, { id: 'D3', label: '3d' },
  { id: 'W1', label: '1w' },
  { id: 'MO1', label: '1mo' }, { id: 'MO3', label: '3mo' }, { id: 'MO6', label: '6mo' },
  { id: 'Y1', label: '1y' }
];

// Duracion nominal de cada timeframe en segundos, para ubicar el marcador de
// senal (ver applyMarker) sin depender de la diferencia entre las dos
// primeras velas cargadas -- esa resta se rompia con un simple hueco entre
// esas dos velas especificas (comun en simbolos de bajo volumen como los que
// buscan estos escaners: un minuto sin ninguna operacion no genera vela),
// que inflaba el "ancho de vela" calculado y desalineaba el marcador varias
// barras respecto a donde realmente disparo la senal.
const TIMEFRAME_SECONDS: Record<string, number> = {
  M1: 60, M2: 120, M3: 180, M5: 300, M10: 600, M15: 900, M30: 1800, M45: 2700,
  H1: 3600, H2: 7200, H3: 10800, H4: 14400, H12: 43200,
  D1: 86400, D2: 172800, D3: 259200, W1: 604800,
  MO1: 2592000, MO3: 7776000, MO6: 15552000, Y1: 31536000
};

const PRIMARY_TIMEFRAME_IDS = ['M1', 'M5', 'M15', 'H1', 'D1'];
const PRIMARY_TIMEFRAMES = PRIMARY_TIMEFRAME_IDS.map(id => TIMEFRAMES.find(tf => tf.id === id)!);
const MORE_TIMEFRAME_GROUPS: { label: string; items: TimeframeOption[] }[] = [
  { label: 'Minutos', items: TIMEFRAMES.filter(tf => tf.id.startsWith('M') && !PRIMARY_TIMEFRAME_IDS.includes(tf.id)) },
  { label: 'Horas', items: TIMEFRAMES.filter(tf => tf.id.startsWith('H') && !PRIMARY_TIMEFRAME_IDS.includes(tf.id)) },
  { label: 'Dias/Semanas', items: TIMEFRAMES.filter(tf => ['D2', 'D3', 'W1'].includes(tf.id)) },
  { label: 'Meses/Ano', items: TIMEFRAMES.filter(tf => ['MO1', 'MO3', 'MO6', 'Y1'].includes(tf.id)) },
];

// Cuando el rango visible se acerca a esta distancia (en barras) del inicio
// de lo ya cargado, se pide mas historial a historical-data-service (via
// marketdata-service) antes de que el usuario llegue al borde y vea un
// hueco en blanco.
const LOAD_MORE_THRESHOLD_BARS = 20;
const LOAD_MORE_BATCH_SIZE = 500;

// shiftSeconds desplaza el tiempo real (UTC) al "tiempo falso" que hace que
// lightweight-charts, al formatearlo con el reloj local del navegador, lo
// muestre como hora de mercado (Nueva York) -- unico truco soportado por la
// libreria, ver TimezoneService.getMarketDisplayShiftSeconds(). bar.time en
// si sigue siendo UTC real en todo el resto del componente (paginacion,
// comparaciones con markerTime, etc.), el desplazamiento es solo visual.
function toCandlestickData(bar: CandleBar, shiftSeconds: number): CandlestickData<Time> {
  return { time: (bar.time + shiftSeconds) as Time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
}

// Timeframes de calendario (D1 en adelante): el backend los estampa a
// medianoche UTC del dia de la sesion (convencion por defecto de dxFeed), asi
// que la fecha correcta de la vela ES la fecha UTC del timestamp. Aplicarles
// el shift "de mercado" de -4h los deja la noche ANTERIOR en cualquier zona
// horaria al oeste de Nueva York -- confirmado en vivo con MDXH: la vela del
// viernes se dibujaba bajo el jueves y el viernes quedaba vacio. Para estos
// timeframes el shift correcto es el offset UTC del navegador (positivo al
// oeste), que lleva la medianoche UTC a medianoche LOCAL del mismo dia y el
// rotulo del eje cae en la fecha de la sesion sin importar la zona horaria.
const CALENDAR_TIMEFRAME_IDS = new Set(['D1', 'D2', 'D3', 'W1', 'MO1', 'MO3', 'MO6', 'Y1']);

function isWellFormed(bar: CandleBar): boolean {
  return [bar.time, bar.open, bar.high, bar.low, bar.close].every(v => v !== null && v !== undefined && Number.isFinite(v));
}

// El backend puede mandar OHLC nulo en una barra puntual (ej. sin trades en
// ese periodo) -- lightweight-charts truena ("Value is null") si le llega
// asi tal cual a setData/update. Se descarta esa barra en vez de romper todo
// el grafico. Tambien deduplica por time (se queda con la ultima) ya que
// setData exige tiempos estrictamente ascendentes y unicos.
function sanitizeBars(bars: CandleBar[]): CandleBar[] {
  const byTime = new Map<number, CandleBar>();
  for (const bar of bars) {
    if (isWellFormed(bar)) byTime.set(bar.time, bar);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

function fromHistoricalDto(dto: HistoricalCandleDTO): CandleBar {
  return {
    time: Math.floor(new Date(dto.timestamp).getTime() / 1000),
    open: dto.open, high: dto.high, low: dto.low, close: dto.close, volume: dto.volume,
    closed: true,
  };
}

@Component({
  selector: 'app-symbol-chart',
  standalone: true,
  imports: [
    CommonModule, MatButtonToggleModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatProgressSpinnerModule, MatTooltipModule, TranslateModule, PageMaintenance
  ],
  templateUrl: './symbol-chart.component.html',
  styleUrls: ['./symbol-chart.component.scss']
})
export class SymbolChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) symbol!: string;
  @Input() initialTimeframe?: string;
  @Input() markerTime?: number;
  @Input() markerTimeframe?: string;
  @Input() buyPriceLine?: number;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  readonly primaryTimeframes = PRIMARY_TIMEFRAMES;
  readonly moreTimeframeGroups = MORE_TIMEFRAME_GROUPS;
  readonly selectedTimeframe = signal<string>('M15');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly hasNoData = signal<boolean>(false);
  readonly maintenance = signal<boolean>(false);
  readonly drawingTool = signal<DrawingTool>('cursor');
  readonly drawingHint = signal<string | null>(null);

  private readonly candleStream = inject(CandleStreamService);
  private readonly screenerService = inject(ScreenerService);
  // Se calcula una sola vez (no cambia mientras la pestaña siga abierta en
  // el mismo horario de verano/invierno) en vez de recalcularlo en cada
  // vela -- ver toCandlestickData().
  private readonly marketShiftSeconds = inject(TimezoneService).getMarketDisplayShiftSeconds();
  private readonly userOffsetSeconds = inject(TimezoneService).getUserTimezoneOffsetMinutes() * 60;

  // displayShift elige el desplazamiento visual segun el timeframe -- ver
  // CALENDAR_TIMEFRAME_IDS: en velas de calendario, el offset UTC del
  // navegador; en intraday, el shift de mercado de siempre.
  private displayShift(): number {
    return CALENDAR_TIMEFRAME_IDS.has(this.selectedTimeframe()) ? this.userOffsetSeconds : this.marketShiftSeconds;
  }
  private chart: IChartApi | null = null;
  private series: ISeriesApi<'Candlestick'> | null = null;
  private buyPriceLineRef: IPriceLine | null = null;
  private signalLinePrimitive: VerticalLinePrimitive | null = null;
  private drawingManager: ChartDrawingManager | null = null;
  private streamSubscription: Subscription | null = null;

  private allBars: CandleBar[] = [];
  private oldestTime: number | null = null;
  private hasMoreHistory = true;
  private isLoadingMore = false;
  // El timeScale es del chart, no de la serie -- removeSeries/addSeries en
  // resubscribe() no lo toca, asi que sin esto cambiar de temporalidad
  // dejaba la vista en el mismo rango logico (misma "zona" visual) en vez
  // de arrancar mostrando las barras mas recientes de la nueva serie.
  private pendingViewReset = false;
  // Una vez que applyMarker() encuentra y dibuja la vela objetivo, la linea
  // se mantiene sola (VerticalLinePrimitive recalcula su posicion por
  // tiempo, no por indice) -- no hace falta re-centrar la vista cada vez
  // que loadMoreHistory() trae mas barras viejas por el scroll normal del
  // usuario. Sin esto, navegar lejos de la senal la traia de vuelta a la
  // fuerza en cuanto llegaba la siguiente pagina de historial.
  private markerFound = false;
  // true solo cuando el marcador ya se dibujo en el cierre REAL de su vela
  // de origen (la barra siguiente exacta), no en el fallback de apertura.
  // Distinto de markerFound: una senal recien generada puede resolverse al
  // fallback porque la vela siguiente (su propio cierre) todavia no existia
  // en el historial inicial -- llega segundos despues por el stream en vivo,
  // y sin este flag el marcador se quedaba pegado en la apertura para
  // siempre en vez de saltar a la posicion correcta apenas esa vela llega.
  private markerAtCloseInstant = false;

  ngAfterViewInit(): void {
    if (this.initialTimeframe) this.selectedTimeframe.set(this.initialTimeframe);
    this.initChart();
    this.resubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart) return;
    const symbolChanged = changes['symbol'] && !changes['symbol'].firstChange;
    const timeframeChanged = changes['initialTimeframe'] && !changes['initialTimeframe'].firstChange
      && this.initialTimeframe !== undefined && this.initialTimeframe !== this.selectedTimeframe();
    if (symbolChanged || timeframeChanged) {
      if (timeframeChanged) this.selectedTimeframe.set(this.initialTimeframe!);
      this.resubscribe();
    } else {
      if (changes['markerTime'] && !changes['markerTime'].firstChange) {
        this.markerFound = false;
        this.markerAtCloseInstant = false;
        this.applyMarker();
      }
      if (changes['buyPriceLine'] && !changes['buyPriceLine'].firstChange) this.applyBuyPriceLine();
    }
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
    this.drawingManager?.destroy();
    this.chart?.remove();
  }

  onTimeframeChange(timeframe: string): void {
    if (timeframe === this.selectedTimeframe()) return;
    this.selectedTimeframe.set(timeframe);
    this.resubscribe();
  }

  isPrimaryTimeframe(id: string): boolean {
    return PRIMARY_TIMEFRAME_IDS.includes(id);
  }

  setDrawingTool(tool: DrawingTool): void {
    this.drawingTool.set(tool);
    this.drawingManager?.setMode(tool);
    this.chartContainer.nativeElement.style.cursor = tool === 'cursor' ? 'default' : 'crosshair';
    this.updateHint(false);
  }

  private updateHint(hasPending: boolean): void {
    const tool = this.drawingTool();
    if (tool === 'trendline') {
      this.drawingHint.set(hasPending ? 'ASSETS.HINT_TRENDLINE_END' : 'ASSETS.HINT_TRENDLINE_START');
    } else if (tool === 'hline') {
      this.drawingHint.set('ASSETS.HINT_HLINE');
    } else {
      this.drawingHint.set(null);
    }
  }

  private initChart(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#c9d1d9' },
      grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
      timeScale: { timeVisible: true, secondsVisible: false }
    });
    this.series = this.addCandlestickSeries();
    this.applyBuyPriceLine();
    this.drawingManager = new ChartDrawingManager(this.chart, hasPending => this.updateHint(hasPending));
    this.drawingManager.setSeries(this.series);
    this.chart.timeScale().subscribeVisibleLogicalRangeChange(range => this.onVisibleRangeChange(range));
  }

  private addCandlestickSeries(): ISeriesApi<'Candlestick'> {
    return this.chart!.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });
  }

  private resubscribe(): void {
    if (!this.symbol || !this.chart) return;

    this.streamSubscription?.unsubscribe();
    this.drawingManager?.clear();
    this.allBars = [];
    this.oldestTime = null;
    this.hasMoreHistory = true;
    this.isLoadingMore = false;
    this.markerFound = false;
    this.pendingViewReset = true;

    // Recreate the series instead of series.setData([]): an empty array doesn't
    // reliably reset a series that already has data, which left the previous
    // timeframe's bars on screen when the new one had none (e.g. a thin M1
    // history on a closed market) instead of showing an empty chart.
    if (this.series) this.chart.removeSeries(this.series);
    this.series = this.addCandlestickSeries();
    this.signalLinePrimitive = null; // se destruyo junto con la serie removida
    this.buyPriceLineRef = null; // se destruyo junto con la serie removida
    this.applyBuyPriceLine();
    this.drawingManager?.setSeries(this.series);
    this.isLoading.set(true);
    this.error.set(null);
    this.hasNoData.set(false);
    this.maintenance.set(false);

    this.streamSubscription = this.candleStream
      .subscribe(this.symbol, this.selectedTimeframe())
      .subscribe({
        next: (message) => this.handleMessage(message),
        error: () => {
          this.error.set('No se pudo conectar al stream de velas.');
          this.checkMaintenance();
        }
      });
  }

  // El handshake del WS no expone el cuerpo 503/MAINTENANCE del refill (la
  // API de WebSocket del navegador no da acceso a la respuesta HTTP de un
  // handshake rechazado) -- ante un fallo de stream, esta llamada REST
  // liviana (ya pasa por el interceptor global) es la unica forma de saber
  // si la causa es el refill en curso y reemplazar el grafico por
  // <app-page-maintenance> en vez del mensaje generico de conexion.
  private checkMaintenance(): void {
    this.screenerService.getMarkets().subscribe({
      error: (err) => this.maintenance.set(err?.codigoError === 'MAINTENANCE')
    });
  }

  private handleMessage(message: CandleStreamMessage): void {
    if (message.type === 'history') {
      this.allBars = sanitizeBars(message.bars);
      this.oldestTime = this.allBars.length ? this.allBars[0].time : null;
      this.series?.setData(this.allBars.map(bar => toCandlestickData(bar, this.displayShift())));
      if (this.pendingViewReset) {
        this.pendingViewReset = false;
        this.chart?.timeScale().scrollToRealTime();
      }
      this.isLoading.set(false);
      this.maintenance.set(false);
      this.hasNoData.set(this.allBars.length === 0);
      // Re-aplicar la linea de compra simulada cuando llega la data: si se
      // creo sobre la serie vacia (antes del primer historial), el auto-scale
      // del chart puede no incluir su precio y la linea queda fuera de la
      // vista (confirmado en vivo con senales de simbolos con data dispersa,
      // ej. ETFs nuevos como RKLZ).
      this.applyBuyPriceLine();
      this.applyMarker();
    } else if (message.type === 'bar') {
      if (!isWellFormed(message.bar)) return;
      this.mergeLiveBar(message.bar);
      this.series?.update(toCandlestickData(message.bar, this.displayShift()));
      this.isLoading.set(false);
      this.hasNoData.set(false);
      // La vela que marca el cierre real de la senal (markerTime +
      // signalSpacing) puede llegar aca, recien en vivo, si no estaba en el
      // historial inicial -- reintentar hasta que applyMarker() la encuentre
      // y salte del fallback (apertura de su propia vela) al cierre real.
      if (this.markerTime !== undefined && !this.markerAtCloseInstant) this.applyMarker();
    } else if (message.type === 'error') {
      this.error.set(message.message ?? 'Error en el stream de velas.');
      this.checkMaintenance();
    }
  }

  private mergeLiveBar(bar: CandleBar): void {
    const last = this.allBars[this.allBars.length - 1];
    if (last && last.time === bar.time) {
      this.allBars[this.allBars.length - 1] = bar;
    } else {
      this.allBars.push(bar);
    }
  }

  private onVisibleRangeChange(range: LogicalRange | null): void {
    if (!range || !this.hasMoreHistory || this.isLoadingMore || this.oldestTime === null) return;
    if (range.from < LOAD_MORE_THRESHOLD_BARS) {
      this.loadMoreHistory();
    }
  }

  private loadMoreHistory(): void {
    if (this.oldestTime === null) return;
    this.isLoadingMore = true;
    const endDate = new Date(this.oldestTime * 1000).toISOString();

    this.screenerService.getHistoricalCandles(this.symbol, this.selectedTimeframe(), endDate, LOAD_MORE_BATCH_SIZE)
      .subscribe({
        next: (older) => {
          this.isLoadingMore = false;
          if (!older.length) {
            this.hasMoreHistory = false;
            return;
          }
          const olderBars = sanitizeBars(older.map(fromHistoricalDto));
          this.allBars = sanitizeBars([...olderBars, ...this.allBars]);
          if (this.allBars.length) {
            this.oldestTime = this.allBars[0].time;
            this.series?.setData(this.allBars.map(bar => toCandlestickData(bar, this.displayShift())));
            // La vela real del marcador puede no estar en el lote inicial de
            // historial (solo velas recientes) y llegar recien aqui -- sin
            // esto el marcador se quedaba sin dibujar, o pegado al candidato
            // "mas cercano" de ese momento (una barra equivocada) para siempre.
            // Pero solo mientras todavia no se encontro: una vez dibujada, la
            // linea se mantiene sola por tiempo (no por indice), asi que re-
            // centrar la vista en cada pagina de historial que llega por el
            // scroll normal del usuario lo arrastraba de vuelta a la senal a
            // la fuerza aunque estuviera navegando lejos a proposito.
            if (!this.markerFound) this.applyMarker();
          }
          // Solo un batch vacio significa "no hay mas" -- un batch con MENOS
          // de lo pedido no lo significa (confirmado en vivo: una respuesta
          // de 442 barras fue seguida de otra 216 mas atras sin problema),
          // asi que marcar hasMoreHistory=false aca cortaba toda carga futura
          // despues del primer "cargar mas" con una pagina parcial.
        },
        error: () => { this.isLoadingMore = false; }
      });
  }

  private applyMarker(): void {
    if (this.signalLinePrimitive) {
      this.series?.detachPrimitive(this.signalLinePrimitive);
      this.signalLinePrimitive = null;
    }
    if (this.markerTime === undefined || this.allBars.length === 0 || !this.chart || !this.series) return;

    // timeToCoordinate() solo resuelve el tiempo EXACTO de una barra ya
    // cargada -- no existe "la mas cercana" en lightweight-charts
    // (confirmado en la documentacion/issues oficiales de TradingView,
    // github.com/tradingview/lightweight-charts#1716). Pero el objetivo
    // (markerTime) es la APERTURA de la vela donde disparo la senal en SU
    // PROPIO timeframe (ej. M5 abierta a las 13:25, senal real al cerrar a
    // las 13:30) -- por eso se busca la barra de ESTE timeframe cuya ventana
    // CONTIENE el objetivo, y se dibuja en el tiempo de esa barra encontrada
    // (no en el markerTime crudo, que timeToCoordinate no reconoceria en un
    // timeframe mas grueso que el de la senal).
    //
    // Cuando el timeframe mostrado es MAS FINO que el de la senal (ej. senal
    // en M5, viendo M1), buscar "la barra que contiene markerTime" a secas
    // encuentra el PRIMER minuto de la ventana M5 (la apertura), no el
    // ultimo (donde realmente disparo la senal al cerrar la vela M5) --
    // corregido desplazando el objetivo al cierre de la vela de origen.
    const displaySpacing = TIMEFRAME_SECONDS[this.selectedTimeframe()]
      ?? (this.allBars.length > 1 ? this.allBars[1].time - this.allBars[0].time : 60);
    const signalSpacing = this.markerTimeframe ? TIMEFRAME_SECONDS[this.markerTimeframe] : undefined;
    const target = (signalSpacing !== undefined && displaySpacing < signalSpacing)
      ? this.markerTime + signalSpacing - displaySpacing
      : this.markerTime;

    // La ventana de cada barra se toma de la SIGUIENTE barra real cargada
    // (no de displaySpacing fijo) -- displaySpacing asume duracion constante,
    // que es falsa para MO1/MO3/MO6/Y1 (meses/anos de largo variable: un
    // agosto de 31 dias vs. los 30 fijos asumidos dejaba senales de fin de
    // mes sin ninguna barra que las contuviera, y el marcador nunca se
    // dibujaba). Solo la ultima barra cargada (sin siguiente todavia) usa
    // displaySpacing como respaldo.
    const nearestIdx = this.allBars.findIndex((b, i) => {
      if (b.time > target) return false;
      const windowEnd = this.allBars[i + 1]?.time ?? b.time + displaySpacing;
      return target < windowEnd;
    });
    if (nearestIdx === -1) {
      const first = this.allBars[0].time;
      if (target < first && this.hasMoreHistory && !this.isLoadingMore) {
        // El objetivo es mas viejo que lo cargado -- probablemente el lote
        // inicial no llega tan atras todavia. Pedir mas y reintentar cuando
        // llegue (loadMoreHistory ya vuelve a llamar applyMarker()).
        this.loadMoreHistory();
      }
      return;
    }

    this.markerFound = true;

    // La barra encontrada arriba es "la vela donde disparo la senal", pero
    // dibujar en SU PROPIA apertura (this.allBars[nearestIdx].time) pone la
    // linea al INICIO de esa vela -- confirmado en vivo: en M5 viendo M5 se
    // veia al comienzo de la vela, no donde realmente disparo (al cerrar).
    // El cierre real de la vela de origen es un instante fijo en UTC
    // (markerTime + signalSpacing) que no depende del timeframe mostrado --
    // si la barra siguiente YA cargada empieza exactamente ahi (caso comun:
    // mismo timeframe que la senal, o mas fino con el ajuste de arriba), se
    // dibuja en esa frontera real en vez de en la apertura de la barra
    // encontrada. Sin esa barra siguiente (senal en la vela mas reciente,
    // todavia sin la que sigue) o en un timeframe mas grueso que el de la
    // senal (el cierre real cae a mitad de la barra, no en ningun borde),
    // no hay una frontera exacta que timeToCoordinate pueda resolver -- se
    // mantiene la apertura de la barra encontrada como venia haciendo.
    const closeInstant = signalSpacing !== undefined ? this.markerTime + signalSpacing : undefined;
    const nextBar = this.allBars[nearestIdx + 1];
    const foundCloseInstant = closeInstant !== undefined && nextBar !== undefined && nextBar.time === closeInstant;
    const lineTime = foundCloseInstant ? nextBar!.time : this.allBars[nearestIdx].time;
    this.markerAtCloseInstant = foundCloseInstant;

    // + displayShift(): el eje del chart esta en tiempo desplazado (ver
    // toCandlestickData y displayShift -- de mercado en intraday, offset del
    // navegador en timeframes de calendario), asi que timeToCoordinate
    // necesita el mismo tiempo desplazado para encontrar la barra, no el UTC
    // real.
    const barTime = lineTime + this.displayShift();
    this.chart.timeScale().setVisibleLogicalRange({ from: nearestIdx - 30, to: nearestIdx + 30 });

    // Puerto del plugin oficial de TradingView (ver drawing/vertical-line-primitive.ts)
    // -- dibuja en el canvas del chart, recalcula su posicion X solo con
    // timeToCoordinate en cada updateAllViews() que el chart llama por su
    // cuenta en cada render. Nada de <div> superpuesto ni reintentos.
    this.signalLinePrimitive = new VerticalLinePrimitive(this.chart, this.series, barTime as Time);
    this.series.attachPrimitive(this.signalLinePrimitive);
  }

  // Linea horizontal de "precio de entrada simulado" para senales del
  // escaner -- a diferencia del marcador de vela, no depende del timeframe
  // (el precio es el mismo sin importar que tan de cerca se mire), asi que
  // se mantiene visible al cambiar de chip. Morado a proposito: naranja ya
  // lo usa la herramienta de dibujo de lineas horizontales del usuario, azul
  // el marcador de vela -- necesitaba un tercer color que no se confundiera
  // con esos dos ni con las velas verdes/rojas.
  private applyBuyPriceLine(): void {
    if (this.buyPriceLineRef) {
      this.series?.removePriceLine(this.buyPriceLineRef);
      this.buyPriceLineRef = null;
    }
    if (this.buyPriceLine === undefined || !this.series) return;
    this.buyPriceLineRef = this.series.createPriceLine({
      price: this.buyPriceLine,
      color: '#ab47bc',
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'Compra (simulada)'
    });
  }
}
