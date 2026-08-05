import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';

class SignalBarRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly x: number | null,
    private readonly yLow: number | null,
    private readonly yHigh: number | null,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    if (this.x === null || this.yLow === null || this.yHigh === null) return;
    const { x, yLow, yHigh } = this;
    target.useMediaCoordinateSpace(({ context }) => {
      context.strokeStyle = '#ab47bc';
      context.lineWidth = 2;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.moveTo(x, yHigh);
      context.lineTo(x, yLow);
      context.stroke();
      context.setLineDash([]);
    });
  }
}

class SignalBarPaneView implements IPrimitivePaneView {
  constructor(private readonly source: SignalBarPrimitive) {}

  renderer(): IPrimitivePaneRenderer | null {
    const { chart, series, barHigh, barLow } = this.source;
    if (!chart || !series || barHigh === undefined || barLow === undefined) return null;
    const x = chart.timeScale().timeToCoordinate(this.source.barTime);
    const yHigh = series.priceToCoordinate(barHigh);
    const yLow = series.priceToCoordinate(barLow);
    if (x === null || yHigh === null || yLow === null) return null;
    return new SignalBarRenderer(x, yLow, yHigh);
  }
}

export class SignalBarPrimitive implements ISeriesPrimitive<Time> {
  chart: IChartApi | null = null;
  series: ISeriesApi<'Candlestick'> | null = null;
  private readonly view = new SignalBarPaneView(this);

  constructor(
    readonly barTime: Time,
    readonly barHigh: number,
    readonly barLow: number,
  ) {}

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart;
    this.series = param.series as ISeriesApi<'Candlestick'>;
  }

  detached(): void {}
  updateAllViews(): void {}
  paneViews(): readonly IPrimitivePaneView[] { return [this.view]; }
}
