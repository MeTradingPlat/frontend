import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  effect,
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CandlestickData, CandlestickSeries, IChartApi, IPriceLine, ISeriesApi,
  LogicalRange, MouseEventParams, Time, createChart
} from 'lightweight-charts';
import { Subscription } from 'rxjs';
import { CandleStreamService } from '../../services/candle-stream.service';
import { ScreenerService } from '../../services/screener.service';
import { TimezoneService } from '../../../../core/services/timezone.service';
import { ThemeService } from '../../../../core/services/theme/theme.service';
import { CandleBar, CandleStreamMessage, HistoricalCandleDTO } from '../../models/candle.models';
import { PivotsResponse } from '../../models/pivots.models';
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
// Tope de una sola pedida al saltar directo hasta la vela de una senal (ver
// applyMarker) -- evita una request absurda para una senal muy vieja o un
// timeframe muy fino, sin volver al patron de a LOAD_MORE_BATCH_SIZE que
// encadenaba decenas de round trips secuenciales.
const MARKER_JUMP_MAX_BARS = 5000;

// lightweight-charts dibuja en <canvas>, no lee variables --mat-sys-* del
// tema Material -- estos dos juegos de colores son el equivalente fijo que
// hay que reaplicar a mano cuando cambia el tema (ver el effect en la
// clase). Los valores de "dark" son los que ya tenia el chart antes de que
// existiera tema claro; los de "light" siguen el mismo criterio de
// contraste que el resto del theming de la app (Material Design 3).
const CHART_COLORS = {
  dark: { text: '#c9d1d9', grid: '#2a2e39' },
  light: { text: '#1a1a1a', grid: '#e0e0e0' }
};

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

// El feed de TastyTrade/dxFeed trae actividad las 24 horas (pre-market,
// post-market, y hasta prints nocturnos de ECN) -- confirmado en vivo el
// 2026-08-30 con AAPL: mas de 1000 barras M1 en un dia, repartidas en las 24
// horas UTC, contra las ~390 de una sesion regular. Sitios de referencia
// como TradingView muestran SOLO la sesion regular por defecto (toggle de
// "extended hours" aparte) -- sin este mismo filtro, nuestra vela se ve con
// una escala/forma totalmente distinta a simple vista aunque los datos en si
// sean correctos, no por un bug de calculo sino por cuantas barras entran en
// el dia. Solo aplica a timeframes intraday: los de calendario (D1 en
// adelante) ya son un solo agregado del dia entero, filtrarlos no tiene
// sentido.
const NY_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false
});
const REGULAR_SESSION_START_MINUTES = 9 * 60 + 30;
const REGULAR_SESSION_END_MINUTES = 16 * 60;

function minutesOfDayInNewYork(utcSeconds: number): number {
  const parts = NY_TIME_FORMATTER.formatToParts(new Date(utcSeconds * 1000));
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

function isRegularSession(utcSeconds: number): boolean {
  const minutes = minutesOfDayInNewYork(utcSeconds);
  return minutes >= REGULAR_SESSION_START_MINUTES && minutes < REGULAR_SESSION_END_MINUTES;
}

// Mismos cortes K/M/B que TradingView usa para el volumen del legend --
// un numero crudo de 6+ cifras (comun incluso en velas de 1 minuto de
// simbolos liquidos) no entra legible en el espacio chico del overlay.
function formatCompactVolume(volume: number): string {
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
  return volume.toString();
}

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
  // Instante REAL en que se genero/mando la senal (registros_log.timestamp),
  // no la apertura de una vela -- ver el comentario de applyMarker.
  @Input() markerTime?: number;
  @Input() buyPriceLine?: number;
  // Avisa hacia arriba cuando el timeframe cambia DESDE el selector propio
  // del grafico (no desde initialTimeframe) -- simetrico a como
  // initialTimeframe ya empuja el timeframe hacia abajo, para que los chips
  // de informacion de la senal (arriba) puedan reflejar cual esta activo.
  @Output() timeframeChange = new EventEmitter<string>();
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
  readonly pivotsActive = signal(false);
  readonly pivotsLoading = signal(false);
  readonly pivotsEmpty = signal(false);
  // true = horario extendido incluido por defecto (a diferencia del
  // default de TradingView) -- decision explicita del usuario, ver el
  // comentario de isRegularSession mas arriba para el porque del filtro.
  readonly extendedHours = signal(true);
  readonly legend = signal<{ open: number; high: number; low: number; close: number; volume: number } | null>(null);

  private readonly candleStream = inject(CandleStreamService);
  private readonly screenerService = inject(ScreenerService);
  // Titulos de createPriceLine() se dibujan desde codigo TS (API de la
  // libreria de graficos), no desde el HTML -- el pipe `| translate` no
  // aplica aca, hace falta el servicio para traducir en el momento.
  private readonly translate = inject(TranslateService);
  // Se calcula una sola vez (no cambia mientras la pestaña siga abierta en
  // el mismo horario de verano/invierno) en vez de recalcularlo en cada
  // vela -- ver toCandlestickData().
  private readonly marketShiftSeconds = inject(TimezoneService).getMarketDisplayShiftSeconds();
  private readonly userOffsetSeconds = inject(TimezoneService).getUserTimezoneOffsetMinutes() * 60;

  // El chart es un <canvas> (lightweight-charts), no CSS -- no puede leer
  // variables --mat-sys-* del tema, asi que sus colores quedaban fijos para
  // tema oscuro (confirmado en vivo: texto e grid ilegibles en tema claro).
  // Este effect reaplica los colores del tema activo cada vez que cambia.
  private readonly theme = inject(ThemeService);
  private readonly applyChartTheme = effect(() => {
    const colors = this.theme.isDark() ? CHART_COLORS.dark : CHART_COLORS.light;
    this.chart?.applyOptions({
      layout: { textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } }
    });
  });

  // displayShift elige el desplazamiento visual segun el timeframe -- ver
  // CALENDAR_TIMEFRAME_IDS: en velas de calendario, el offset UTC del
  // navegador; en intraday, el shift de mercado de siempre.
  private displayShift(): number {
    return CALENDAR_TIMEFRAME_IDS.has(this.selectedTimeframe()) ? this.userOffsetSeconds : this.marketShiftSeconds;
  }
  private chart: IChartApi | null = null;
  private series: ISeriesApi<'Candlestick'> | null = null;
  private buyPriceLineRef: IPriceLine | null = null;
  private pivotPriceLines: IPriceLine[] = [];
  // Los pivots son D1 fijo, independientes del timeframe que se este viendo
  // en el chart -- cambiar de timeframe no invalida esta respuesta, solo
  // cambiar de simbolo (comparado via lastPivotsResponse.symbol).
  private lastPivotsResponse: PivotsResponse | null = null;
  private signalLinePrimitive: VerticalLinePrimitive | null = null;
  private drawingManager: ChartDrawingManager | null = null;
  private streamSubscription: Subscription | null = null;
  // Invalida mensajes en vuelo de una suscripcion anterior: unsubscribe() no
  // garantiza que un 'history' ya en camino (WebSocket/red movil lenta) deje
  // de entregarse -- sin esto, cambiar de timeframe rapido (comun en tactil)
  // podia dejar que ese mensaje tardio pisara el estado ya reseteado de la
  // nueva suscripcion, dibujando la horizontal (sincronica, no depende del
  // stream) pero nunca la vertical (depende de handleMessage). Confirmado
  // reportado en movil tras limpiar cache -- justo el escenario de reconexion
  // lenta que expone la carrera.
  private resubscribeGeneration = 0;

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
    this.timeframeChange.emit(timeframe);
  }

  isPrimaryTimeframe(id: string): boolean {
    return PRIMARY_TIMEFRAME_IDS.includes(id);
  }

  isCalendarTimeframe(): boolean {
    return CALENDAR_TIMEFRAME_IDS.has(this.selectedTimeframe());
  }

  formatVolume(volume: number): string {
    return formatCompactVolume(volume);
  }

  // Recarga el historial desde cero (igual que un cambio de timeframe) en
  // vez de filtrar en el momento sobre allBars ya cargado -- applyMarker y
  // la paginacion (oldestTime/hasMoreHistory) trabajan por INDICE sobre
  // allBars, y filtrar aparte solo al dibujar habria desalineado esos
  // indices contra lo que la libreria realmente muestra.
  toggleExtendedHours(): void {
    this.extendedHours.update(v => !v);
    this.resubscribe();
  }

  private filterSession(bars: CandleBar[]): CandleBar[] {
    if (this.extendedHours() || this.isCalendarTimeframe()) return bars;
    return bars.filter(bar => isRegularSession(bar.time));
  }

  // Legend estilo TradingView: sin hover muestra la ULTIMA barra cargada: se
  // llama tambien desde handleMessage/loadMoreHistory ademas del crosshair.
  private updateLegend(bar: CandleBar | undefined | null): void {
    this.legend.set(bar ? { open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume } : null);
  }

  private lastBar(): CandleBar | undefined {
    return this.allBars[this.allBars.length - 1];
  }

  private onCrosshairMove(param: MouseEventParams<Time>): void {
    if (param.time === undefined) {
      this.updateLegend(this.lastBar());
      return;
    }
    // La serie de velas (param.seriesData) solo trae OHLC, sin volumen -- se
    // busca la barra propia por tiempo (con el mismo desplazamiento visual
    // que toCandlestickData le aplico al armar la serie) para completarlo.
    const shift = this.displayShift();
    const bar = this.allBars.find(b => b.time + shift === param.time);
    this.updateLegend(bar ?? this.lastBar());
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
    const colors = this.theme.isDark() ? CHART_COLORS.dark : CHART_COLORS.light;
    this.chart = createChart(this.chartContainer.nativeElement, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      // rightOffset deja hueco despues de la ultima vela -- sin esto la vela
      // en formacion queda pegada al borde derecho, sin espacio para verla
      // "avanzar" a medida que llegan ticks nuevos.
      timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 10 }
    });
    this.series = this.addCandlestickSeries();
    this.applyBuyPriceLine();
    this.drawingManager = new ChartDrawingManager(this.chart, hasPending => this.updateHint(hasPending));
    this.drawingManager.setSeries(this.series);
    this.chart.timeScale().subscribeVisibleLogicalRangeChange(range => this.onVisibleRangeChange(range));
    this.chart.subscribeCrosshairMove(param => this.onCrosshairMove(param));
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

    const generation = ++this.resubscribeGeneration;
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
    this.pivotPriceLines = []; // se destruyeron junto con la serie removida
    if (this.pivotsActive() && this.lastPivotsResponse?.symbol === this.symbol) {
      // Mismo simbolo, solo cambio el timeframe visible -- redibuja sobre la
      // serie nueva sin volver a pedir (los pivots no dependen de este timeframe).
      this.drawPivots(this.lastPivotsResponse);
    } else {
      this.pivotsActive.set(false);
      this.pivotsEmpty.set(false);
      this.lastPivotsResponse = null;
    }
    this.applyBuyPriceLine();
    this.drawingManager?.setSeries(this.series);
    this.isLoading.set(true);
    this.error.set(null);
    this.hasNoData.set(false);
    this.maintenance.set(false);

    this.streamSubscription = this.candleStream
      .subscribe(this.symbol, this.selectedTimeframe())
      .subscribe({
        next: (message) => {
          if (generation !== this.resubscribeGeneration) return;
          this.handleMessage(message);
        },
        error: () => {
          if (generation !== this.resubscribeGeneration) return;
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
      // oldestTime es el CURSOR de paginacion (endDate del proximo pedido),
      // no "la primera barra que se ve" -- tiene que venir del lote CRUDO,
      // sin filtrar. Con horario extendido desactivado, un lote de la
      // sesion regular (~390 min/dia de 1440) puede filtrarse case a casi
      // nada; usar el primer bar YA FILTRADO como cursor dejaba la
      // paginacion pidiendo una y otra vez la MISMA ventana cruda (mismo
      // endDate) sin avanzar nunca hacia atras -- confirmado en vivo con
      // IBIT: sin horario extendido, ir hacia atras no traia nada nuevo.
      const rawBars = sanitizeBars(message.bars);
      this.allBars = this.filterSession(rawBars);
      this.oldestTime = rawBars.length ? rawBars[0].time : null;
      this.series?.setData(this.allBars.map(bar => toCandlestickData(bar, this.displayShift())));
      this.updateLegend(this.lastBar());
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
      // Fuera de la sesion regular con el filtro activo: se ignora del todo
      // (ni se dibuja ni se guarda en allBars) -- activar "extendido" mas
      // tarde recarga desde cero via resubscribe(), no depende de haber
      // acumulado estas barras aca.
      if (!this.extendedHours() && !this.isCalendarTimeframe() && !isRegularSession(message.bar.time)) return;
      this.mergeLiveBar(message.bar);
      this.series?.update(toCandlestickData(message.bar, this.displayShift()));
      this.updateLegend(message.bar);
      this.isLoading.set(false);
      this.hasNoData.set(false);
      // La vela que contiene markerTime puede llegar aca, recien en vivo, si
      // no estaba en el historial inicial -- reintentar hasta encontrarla.
      if (this.markerTime !== undefined && !this.markerFound) this.applyMarker();
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

  private loadMoreHistory(barsOverride?: number): void {
    if (this.oldestTime === null) return;
    this.isLoadingMore = true;
    const generation = this.resubscribeGeneration;
    const endDate = new Date(this.oldestTime * 1000).toISOString();

    this.screenerService.getHistoricalCandles(this.symbol, this.selectedTimeframe(), endDate, barsOverride ?? LOAD_MORE_BATCH_SIZE)
      .subscribe({
        next: (older) => {
          if (generation !== this.resubscribeGeneration) return;
          this.isLoadingMore = false;
          if (!older.length) {
            this.hasMoreHistory = false;
            return;
          }
          // Cursor del CRUDO, no de lo ya filtrado -- ver el comentario de
          // oldestTime en el handler de 'history'. Siempre estrictamente
          // mas viejo que el endDate de este mismo pedido (el backend solo
          // devuelve barras anteriores a el), asi que garantiza avanzar
          // hacia atras aunque el filtro deje esta pagina sin nada que
          // mostrar.
          const rawOlderBars = sanitizeBars(older.map(fromHistoricalDto));
          const olderBars = this.filterSession(rawOlderBars);
          this.allBars = sanitizeBars([...olderBars, ...this.allBars]);
          if (rawOlderBars.length) this.oldestTime = rawOlderBars[0].time;
          if (this.allBars.length) {
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
        error: () => {
          if (generation !== this.resubscribeGeneration) return;
          this.isLoadingMore = false;
        }
      });
  }

  // markerTime es el instante REAL en que se genero/publico la senal
  // (registros_log.timestamp), no la apertura de una vela -- por eso solo
  // hace falta encontrar que barra ya cargada CONTIENE ese instante, sin
  // ninguna conversion entre el timeframe de origen de la senal y el que se
  // esta mostrando (eso existia antes, cuando el objetivo era la vela
  // tecnica; se quito con el marcador unico, ver commit que lo introdujo).
  //
  // timeToCoordinate() solo resuelve el tiempo EXACTO de una barra ya
  // cargada -- no existe "la mas cercana" en lightweight-charts (confirmado
  // en la documentacion/issues oficiales de TradingView,
  // github.com/tradingview/lightweight-charts#1716), de ahi la busqueda por
  // ventana en vez de pasarle markerTime crudo.
  private applyMarker(): void {
    if (this.signalLinePrimitive) {
      this.series?.detachPrimitive(this.signalLinePrimitive);
      this.signalLinePrimitive = null;
    }
    if (this.markerTime === undefined || this.allBars.length === 0 || !this.chart || !this.series) return;

    const target = this.markerTime;
    // La ventana de cada barra se toma de la SIGUIENTE barra real cargada
    // (no de un periodo fijo) -- un periodo fijo asume duracion constante,
    // que es falsa para MO1/MO3/MO6/Y1 (meses/anos de largo variable: un
    // agosto de 31 dias vs. los 30 fijos asumidos dejaba senales de fin de
    // mes sin ninguna barra que las contuviera). Solo la ultima barra
    // cargada (sin siguiente todavia) usa el periodo nominal como respaldo.
    const period = TIMEFRAME_SECONDS[this.selectedTimeframe()]
      ?? (this.allBars.length > 1 ? this.allBars[1].time - this.allBars[0].time : 60);
    const nearestIdx = this.allBars.findIndex((b, i) => {
      if (b.time > target) return false;
      const windowEnd = this.allBars[i + 1]?.time ?? b.time + period;
      return target < windowEnd;
    });
    if (nearestIdx === -1) {
      const first = this.allBars[0].time;
      if (target < first && this.hasMoreHistory && !this.isLoadingMore) {
        // El objetivo es mas viejo que lo cargado. Saltar directo a cubrir
        // TODO el hueco hasta el objetivo en una sola pedida (acotada por
        // MARKER_JUMP_MAX_BARS) en vez de pedir de a LOAD_MORE_BATCH_SIZE e
        // ir reintentando -- una senal de hace horas/dias, o un simbolo de
        // bajo volumen con huecos que hacen que 500 barras alcancen mucho
        // menos tiempo real del esperado, encadenaba decenas de round trips
        // secuenciales antes de alcanzar la vela real (confirmado: abrir el
        // mismo simbolo desde Activos -- sin markerTime, sin esta cadena --
        // era instantaneo, pero abrir una senal se sentia lento). El tamano
        // se calcula como el numero de periodos completos en el hueco (cota
        // superior real de barras posibles ahi, los huecos solo la bajan) +
        // margen; si el hueco es mas grande que el tope, esta misma logica
        // se vuelve a ejecutar tras cada pedida (loadMoreHistory ya llama a
        // applyMarker() de nuevo), acortando la cadena en vez de eliminarla.
        const barsNeeded = Math.min(Math.ceil((first - target) / period) + 10, MARKER_JUMP_MAX_BARS);
        this.loadMoreHistory(Math.max(barsNeeded, LOAD_MORE_BATCH_SIZE));
      }
      return;
    }

    this.markerFound = true;

    // + displayShift(): el eje del chart esta en tiempo desplazado (ver
    // toCandlestickData y displayShift -- de mercado en intraday, offset del
    // navegador en timeframes de calendario), asi que timeToCoordinate
    // necesita el mismo tiempo desplazado para encontrar la barra, no el UTC
    // real.
    const barTime = this.allBars[nearestIdx].time + this.displayShift();
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
      title: this.translate.instant('ASSETS.SIGNAL_LINE')
    });
  }

  // Picos y valles (Pivots) -- exploratorio, con los valores por defecto del
  // indicador de salida en configuracion de escaner (ATR 14, 5 años D1, 1
  // nivel por lado). Toggle: un segundo click limpia las lineas sin
  // reconsultar.
  togglePivots(): void {
    if (this.pivotsActive()) {
      this.pivotsActive.set(false);
      this.clearPivots();
      this.series?.priceScale().setAutoScale(true);
      return;
    }
    this.pivotsEmpty.set(false);
    // Mismo simbolo ya consultado (toggle off/on) -- redibuja lo cacheado en
    // vez de volver a pedir. Los niveles son fijos mientras se siga viendo
    // el mismo simbolo; solo cambiar de simbolo invalida lastPivotsResponse
    // (ver symbolChanged en ngOnChanges). Sin el alejamiento inicial -- ese
    // solo aplica la primera vez que se calculan (ver el subscribe de abajo).
    if (this.lastPivotsResponse?.symbol === this.symbol) {
      this.pivotsActive.set(true);
      this.drawPivots(this.lastPivotsResponse);
      return;
    }
    this.pivotsLoading.set(true);
    this.screenerService.getPivots(this.symbol).subscribe({
      // El backend responde 204 (exito, sin cuerpo -- no es un error HTTP)
      // cuando no pudo calcular pivots para el simbolo, asi que response
      // llega null aca, no al callback de error. Tambien puede responder 200
      // con resistances/supports vacios (si encontro el simbolo pero ningun
      // nivel califico) -- en ninguno de los dos casos hay algo que dibujar,
      // asi que el boton no debe quedar marcado como activo.
      next: (response) => {
        this.pivotsLoading.set(false);
        if (!response || (!response.resistances.length && !response.supports.length)) {
          this.pivotsEmpty.set(true);
          return;
        }
        this.pivotsActive.set(true);
        this.lastPivotsResponse = response;
        this.drawPivots(response);
        this.applyInitialPivotZoom(response);
      },
      error: () => {
        this.pivotsLoading.set(false);
      }
    });
  }

  // Aleja la vista lo justo para asomar los pivots que quedan fuera del
  // rango natural de las velas visibles -- solo al calcularlos por primera
  // vez (no en cada redibujo ni en cada tick del stream, que es lo que
  // causaba el reajuste constante que se veia como si el precio "no se
  // mantuviera" en timeframes intraday). SOFTEN < 1 para no ir hasta el
  // pivot mas lejano de una vez, solo acercar la vista sin alejarla tanto
  // como antes.
  private static readonly PIVOT_ZOOM_SOFTEN = 0.35;

  private applyInitialPivotZoom(response: PivotsResponse): void {
    if (!this.series) return;
    const priceScale = this.series.priceScale();
    const visible = priceScale.getVisibleRange();
    if (!visible) return;
    const precios = [...response.resistances.map(r => r.price), ...response.supports.map(s => s.price)];
    if (!precios.length) return;
    const minPivot = Math.min(...precios);
    const maxPivot = Math.max(...precios);
    const from = minPivot < visible.from ? visible.from - (visible.from - minPivot) * SymbolChartComponent.PIVOT_ZOOM_SOFTEN : visible.from;
    const to = maxPivot > visible.to ? visible.to + (maxPivot - visible.to) * SymbolChartComponent.PIVOT_ZOOM_SOFTEN : visible.to;
    if (from === visible.from && to === visible.to) return;
    priceScale.setAutoScale(false);
    priceScale.setVisibleRange({ from, to });
  }

  // Fuerte vs debil se dibujan por separado (no fusionados en un solo
  // "Resistencia"/"Soporte") -- mismo criterio que la referencia
  // (PivotsAlpaca: Pico/Valle Fuerte/Debil como 4 lineas distintas). Fuerte
  // en linea solida mas gruesa (mayor confianza), debil punteada mas fina
  // (relleno automático cuando no hay suficientes fuertes).
  private drawPivots(response: PivotsResponse): void {
    this.clearPivots();
    if (!this.series) return;
    for (const resistencia of response.resistances) {
      const esFuerte = resistencia.strength === 'strong';
      this.pivotPriceLines.push(this.series.createPriceLine({
        price: resistencia.price, color: '#ef5350', lineWidth: esFuerte ? 2 : 1,
        lineStyle: esFuerte ? 2 : 1, axisLabelVisible: true,
        title: this.translate.instant(esFuerte ? 'ASSETS.RESISTANCE_STRONG' : 'ASSETS.RESISTANCE_WEAK')
      }));
    }
    for (const soporte of response.supports) {
      const esFuerte = soporte.strength === 'strong';
      this.pivotPriceLines.push(this.series.createPriceLine({
        price: soporte.price, color: '#26a69a', lineWidth: esFuerte ? 2 : 1,
        lineStyle: esFuerte ? 2 : 1, axisLabelVisible: true,
        title: this.translate.instant(esFuerte ? 'ASSETS.SUPPORT_STRONG' : 'ASSETS.SUPPORT_WEAK')
      }));
    }
  }

  private clearPivots(): void {
    for (const line of this.pivotPriceLines) {
      this.series?.removePriceLine(line);
    }
    this.pivotPriceLines = [];
  }
}
