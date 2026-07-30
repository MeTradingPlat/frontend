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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CandlestickData, CandlestickSeries, IChartApi, ISeriesApi, Time, createChart } from 'lightweight-charts';
import { Subscription } from 'rxjs';
import { CandleStreamService } from '../../services/candle-stream.service';
import { CandleBar, CandleStreamMessage } from '../../models/candle.models';

interface TimeframeOption {
  id: string;
  label: string;
}

// Mismo set de 21 timeframes que ya soportan marketdata-service y
// scanner-management-service -- antes solo tenia estos 8, dejando fuera
// 13 valores que el resto de la plataforma ya reconocia.
const TIMEFRAMES: TimeframeOption[] = [
  { id: 'M1', label: '1m' },
  { id: 'M2', label: '2m' },
  { id: 'M3', label: '3m' },
  { id: 'M5', label: '5m' },
  { id: 'M10', label: '10m' },
  { id: 'M15', label: '15m' },
  { id: 'M30', label: '30m' },
  { id: 'M45', label: '45m' },
  { id: 'H1', label: '1h' },
  { id: 'H2', label: '2h' },
  { id: 'H3', label: '3h' },
  { id: 'H4', label: '4h' },
  { id: 'H12', label: '12h' },
  { id: 'D1', label: '1d' },
  { id: 'D2', label: '2d' },
  { id: 'D3', label: '3d' },
  { id: 'W1', label: '1w' },
  { id: 'MO1', label: '1mo' },
  { id: 'MO3', label: '3mo' },
  { id: 'MO6', label: '6mo' },
  { id: 'Y1', label: '1y' }
];

function toCandlestickData(bar: CandleBar): CandlestickData<Time> {
  return { time: bar.time as Time, open: bar.open, high: bar.high, low: bar.low, close: bar.close };
}

@Component({
  selector: 'app-symbol-chart',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './symbol-chart.component.html',
  styleUrls: ['./symbol-chart.component.scss']
})
export class SymbolChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) symbol!: string;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  readonly timeframes = TIMEFRAMES;
  readonly selectedTimeframe = signal<string>('M15');
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly hasNoData = signal<boolean>(false);

  private readonly candleStream = inject(CandleStreamService);
  private chart: IChartApi | null = null;
  private series: ISeriesApi<'Candlestick'> | null = null;
  private streamSubscription: Subscription | null = null;

  ngAfterViewInit(): void {
    this.initChart();
    this.resubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && !changes['symbol'].firstChange && this.chart) {
      this.resubscribe();
    }
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
    this.chart?.remove();
  }

  onTimeframeChange(timeframe: string): void {
    if (timeframe === this.selectedTimeframe()) return;
    this.selectedTimeframe.set(timeframe);
    this.resubscribe();
  }

  private initChart(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#c9d1d9' },
      grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
      timeScale: { timeVisible: true, secondsVisible: false }
    });
    this.series = this.addCandlestickSeries();
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
    // Recreate the series instead of series.setData([]): an empty array doesn't
    // reliably reset a series that already has data, which left the previous
    // timeframe's bars on screen when the new one had none (e.g. a thin M1
    // history on a closed market) instead of showing an empty chart.
    if (this.series) this.chart.removeSeries(this.series);
    this.series = this.addCandlestickSeries();
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
      this.series?.setData(message.bars.map(toCandlestickData));
      this.isLoading.set(false);
      this.hasNoData.set(message.bars.length === 0);
    } else if (message.type === 'bar') {
      this.series?.update(toCandlestickData(message.bar));
      this.isLoading.set(false);
      this.hasNoData.set(false);
    } else if (message.type === 'error') {
      this.error.set(message.message ?? 'Error en el stream de velas.');
    }
  }
}
