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
import { CandleBar, CandleStreamMessage, HistoricalCandleDTO } from '../../models/candle.models';
import { ChartDrawingManager, DrawingTool } from './drawing/chart-drawing-manager';
import { VerticalLinePrimitive } from './drawing/vertical-line-primitive';

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

function toCandlestickData(bar: CandleBar): CandlestickData<Time> {
  return { time: bar.time as Time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
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
    MatProgressSpinnerModule, MatTooltipModule, TranslateModule
  ],
  templateUrl: './symbol-chart.component.html',
  styleUrls: ['./symbol-chart.component.scss']
})
export class SymbolChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) symbol!: string;
  @Input() initialTimeframe?: string;
  @Input() markerTime?: number;
  @Input() buyPriceLine?: number;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  readonly primaryTimeframes = PRIMARY_TIMEFRAMES;
  readonly moreTimeframeGroups = MORE_TIMEFRAME_GROUPS;
  readonly selectedTimeframe = signal<string>('M15');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly hasNoData = signal<boolean>(false);
  readonly drawingTool = signal<DrawingTool>('cursor');
  readonly drawingHint = signal<string | null>(null);

  private readonly candleStream = inject(CandleStreamService);
  private readonly screenerService = inject(ScreenerService);
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

    this.streamSubscription = this.candleStream
      .subscribe(this.symbol, this.selectedTimeframe())
      .subscribe({
        next: (message) => this.handleMessage(message),
        error: () => this.error.set('No se pudo conectar al stream de velas.')
      });
  }

  private handleMessage(message: CandleStreamMessage): void {
    if (message.type === 'history') {
      this.allBars = sanitizeBars(message.bars);
      this.oldestTime = this.allBars.length ? this.allBars[0].time : null;
      this.series?.setData(this.allBars.map(toCandlestickData));
      this.isLoading.set(false);
      this.hasNoData.set(this.allBars.length === 0);
      this.applyMarker();
    } else if (message.type === 'bar') {
      if (!isWellFormed(message.bar)) return;
      this.mergeLiveBar(message.bar);
      this.series?.update(toCandlestickData(message.bar));
      this.isLoading.set(false);
      this.hasNoData.set(false);
    } else if (message.type === 'error') {
      this.error.set(message.message ?? 'Error en el stream de velas.');
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
            this.series?.setData(this.allBars.map(toCandlestickData));
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
    // (markerTime) es la vela donde disparo la senal en SU PROPIO timeframe
    // (ej. M5 a las 13:30), que no coincide con el inicio exacto de una vela
    // mas gruesa (H1 arranca en 13:00, D1 en 00:00) salvo que caiga justo en
    // la hora/dia en punto -- por eso se busca la barra de ESTE timeframe
    // cuya ventana [time, time+barSpacing) CONTIENE el objetivo, y se dibuja
    // en el tiempo de esa barra encontrada (no en el markerTime crudo, que
    // timeToCoordinate no reconoceria en un timeframe mas grueso que el de
    // la senal).
    const barSpacing = this.allBars.length > 1 ? this.allBars[1].time - this.allBars[0].time : 60;
    const nearestIdx = this.allBars.findIndex(b => b.time <= this.markerTime! && this.markerTime! < b.time + barSpacing);
    if (nearestIdx === -1) {
      const first = this.allBars[0].time;
      if (this.markerTime < first && this.hasMoreHistory && !this.isLoadingMore) {
        // El objetivo es mas viejo que lo cargado -- probablemente el lote
        // inicial no llega tan atras todavia. Pedir mas y reintentar cuando
        // llegue (loadMoreHistory ya vuelve a llamar applyMarker()).
        this.loadMoreHistory();
      }
      return;
    }

    this.markerFound = true;
    const barTime = this.allBars[nearestIdx].time;
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
