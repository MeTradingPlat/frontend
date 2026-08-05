import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';

export interface SignalLinePoint {
  time: Time;
  price: number;
}

class SignalLineRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly x1: number | null,
    private readonly y1: number | null,
    private readonly x2: number | null,
    private readonly y2: number | null,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    if (this.x1 === null || this.y1 === null || this.x2 === null || this.y2 === null) return;
    const { x1, y1, x2, y2 } = this;
    target.useMediaCoordinateSpace(({ context }) => {
      context.strokeStyle = '#ab47bc';
      context.lineWidth = 2;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.setLineDash([]);
    });
  }
}

class SignalLinePaneView implements IPrimitivePaneView {
  constructor(private readonly source: SignalLinePrimitive) {}

  renderer(): IPrimitivePaneRenderer | null {
    const { chart, series, p1, p2 } = this.source;
    if (!chart || !series) return null;
    const x1 = chart.timeScale().timeToCoordinate(p1.time);
    const y1 = series.priceToCoordinate(p1.price);
    const x2 = chart.timeScale().timeToCoordinate(p2.time);
    const y2 = series.priceToCoordinate(p2.price);
    return new SignalLineRenderer(x1, y1, x2, y2);
  }
}

export class SignalLinePrimitive implements ISeriesPrimitive<Time> {
  chart: IChartApi | null = null;
  series: ISeriesApi<'Candlestick'> | null = null;
  private readonly view = new SignalLinePaneView(this);

  constructor(readonly p1: SignalLinePoint, readonly p2: SignalLinePoint) {}

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart;
    this.series = param.series as ISeriesApi<'Candlestick'>;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
  }

  updateAllViews(): void {}

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.view];
  }
}
