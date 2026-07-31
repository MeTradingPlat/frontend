import { IChartApi, IPriceLine, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts';
import { TrendLinePoint, TrendLinePrimitive } from './trend-line-primitive';

export type DrawingTool = 'cursor' | 'trendline' | 'hline';

type Drawing =
  | { kind: 'hline'; priceLine: IPriceLine; price: number }
  | { kind: 'trendline'; primitive: TrendLinePrimitive };

const CLICK_TOLERANCE_PX = 6;

/**
 * Estado de las herramientas de dibujo basicas del grafico (linea de
 * tendencia + horizontal). Se instancia una vez por grafico (initChart) y se
 * reasigna la serie en cada resubscribe(); las lineas se limpian al cambiar
 * de simbolo/timeframe (ver symbol-chart.component.ts) -- no se intenta
 * reanclar dibujos entre series recreadas.
 *
 * Sin seleccion previa a borrar: en modo cursor, un click cerca de una linea
 * la borra directamente (alcance "basico" acordado).
 */
export class ChartDrawingManager {
  private mode: DrawingTool = 'cursor';
  private series: ISeriesApi<'Candlestick'> | null = null;
  private drawings: Drawing[] = [];
  private pendingPoint: TrendLinePoint | null = null;
  private readonly clickHandler = (p: MouseEventParams<Time>) => this.onClick(p);

  constructor(private readonly chart: IChartApi, private readonly onPendingChange?: (hasPending: boolean) => void) {
    this.chart.subscribeClick(this.clickHandler);
  }

  setSeries(series: ISeriesApi<'Candlestick'>): void {
    this.series = series;
  }

  setMode(mode: DrawingTool): void {
    this.mode = mode;
    this.pendingPoint = null;
    this.onPendingChange?.(false);
  }

  getMode(): DrawingTool {
    return this.mode;
  }

  clear(): void {
    for (const d of this.drawings) this.remove(d);
    this.drawings = [];
    this.pendingPoint = null;
    this.onPendingChange?.(false);
  }

  destroy(): void {
    this.chart.unsubscribeClick(this.clickHandler);
    this.clear();
  }

  private onClick(param: MouseEventParams<Time>): void {
    if (!this.series || !param.point || param.time === undefined) return;
    const price = this.series.coordinateToPrice(param.point.y);
    if (price === null) return;

    if (this.mode === 'hline') {
      this.addHLine(price);
    } else if (this.mode === 'trendline') {
      this.addTrendLinePoint({ time: param.time, price });
    } else {
      this.deleteNearest(param.point.x, param.point.y);
    }
  }

  private addHLine(price: number): void {
    if (!this.series) return;
    const priceLine = this.series.createPriceLine({
      price, color: '#ff9800', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: price.toFixed(2),
    });
    this.drawings.push({ kind: 'hline', priceLine, price });
  }

  private addTrendLinePoint(point: TrendLinePoint): void {
    if (!this.series) return;
    if (!this.pendingPoint) {
      this.pendingPoint = point;
      this.onPendingChange?.(true);
      return;
    }
    const primitive = new TrendLinePrimitive(this.pendingPoint, point);
    this.series.attachPrimitive(primitive);
    this.drawings.push({ kind: 'trendline', primitive });
    this.pendingPoint = null;
    this.onPendingChange?.(false);
  }

  private deleteNearest(x: number, y: number): void {
    let closest: Drawing | null = null;
    let closestDist = CLICK_TOLERANCE_PX;
    for (const d of this.drawings) {
      const dist = this.distanceTo(d, x, y);
      if (dist !== null && dist <= closestDist) {
        closest = d;
        closestDist = dist;
      }
    }
    if (closest) {
      this.remove(closest);
      this.drawings = this.drawings.filter(d => d !== closest);
    }
  }

  private distanceTo(d: Drawing, x: number, y: number): number | null {
    if (!this.series) return null;
    if (d.kind === 'hline') {
      const lineY = this.series.priceToCoordinate(d.price);
      return lineY === null ? null : Math.abs(y - lineY);
    }
    const ts = this.chart.timeScale();
    const x1 = ts.timeToCoordinate(d.primitive.p1.time);
    const y1 = this.series.priceToCoordinate(d.primitive.p1.price);
    const x2 = ts.timeToCoordinate(d.primitive.p2.time);
    const y2 = this.series.priceToCoordinate(d.primitive.p2.price);
    if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
    return pointToSegmentDistance(x, y, x1, y1, x2, y2);
  }

  private remove(d: Drawing): void {
    if (d.kind === 'hline') {
      this.series?.removePriceLine(d.priceLine);
    } else {
      this.series?.detachPrimitive(d.primitive);
    }
  }
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}
