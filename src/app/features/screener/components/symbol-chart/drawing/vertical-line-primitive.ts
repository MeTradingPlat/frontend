import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  Coordinate,
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesOptionsMap,
  Time,
} from 'lightweight-charts';

// Puerto directo del plugin oficial de TradingView (lightweight-charts
// plugin-examples/src/plugins/vertical-line) -- misma tecnica que usa
// series.createPriceLine() para la horizontal: dibuja en el canvas del
// chart, no un <div> superpuesto. updateAllViews() la llama el chart
// automaticamente en cada render (pan/zoom/resize), asi que la posicion X
// siempre se recalcula fresca via timeToCoordinate -- no hace falta
// requestAnimationFrame ni reintentos.
function centreOffset(lineBitmapWidth: number): number {
  return Math.floor(lineBitmapWidth * 0.5);
}

function positionsLine(positionMedia: number, pixelRatio: number, desiredWidthMedia = 1) {
  const scaledPosition = Math.round(pixelRatio * positionMedia);
  const lineBitmapWidth = Math.round(desiredWidthMedia * pixelRatio);
  const offset = centreOffset(lineBitmapWidth);
  return { position: scaledPosition - offset, length: lineBitmapWidth };
}

class VertLineRenderer implements IPrimitivePaneRenderer {
  constructor(private readonly x: Coordinate | null, private readonly color: string, private readonly width: number) {}

  draw(target: CanvasRenderingTarget2D): void {
    if (this.x === null) return;
    target.useBitmapCoordinateSpace(scope => {
      const ctx = scope.context;
      const position = positionsLine(this.x!, scope.horizontalPixelRatio, this.width);
      ctx.fillStyle = this.color;
      ctx.fillRect(position.position, 0, position.length, scope.bitmapSize.height);
    });
  }
}

class VertLinePaneView implements IPrimitivePaneView {
  private x: Coordinate | null = null;

  constructor(private readonly source: VerticalLinePrimitive) {}

  update(): void {
    this.x = this.source.chart.timeScale().timeToCoordinate(this.source.time);
  }

  renderer(): IPrimitivePaneRenderer {
    return new VertLineRenderer(this.x, this.source.color, this.source.width);
  }
}

export class VerticalLinePrimitive implements ISeriesPrimitive<Time> {
  private readonly view = new VertLinePaneView(this);

  constructor(
    readonly chart: IChartApi,
    readonly series: ISeriesApi<keyof SeriesOptionsMap>,
    readonly time: Time,
    readonly color: string = '#ab47bc',
    readonly width: number = 2,
  ) {}

  updateAllViews(): void {
    this.view.update();
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.view];
  }
}
