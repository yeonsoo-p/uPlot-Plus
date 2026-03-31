import { useDrawHook } from '../hooks/useDrawHook';
import { useStore } from '../hooks/useChart';

export interface VectorProps {
  /** Direction angles in degrees (0=N, 90=E). One per data point. */
  directions: ArrayLike<number>;
  /** Series group to overlay on (default: 0) */
  group?: number;
  /** Series index whose y-values determine arrow positions (default: 0) */
  index?: number;
  /** Arrow color (default: '#c0392b') */
  color?: string;
  /** Min arrow size in CSS px (default: 4) */
  minSize?: number;
  /** Max arrow size in CSS px (default: 10) */
  maxSize?: number;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  size: number,
): void {
  const rad = (angle - 90) * (Math.PI / 180);
  const len = size;
  const headLen = len * 0.35;
  const headAngle = Math.PI / 6;

  const tipX = cx + Math.cos(rad) * len;
  const tipY = cy + Math.sin(rad) * len;
  const tailX = cx - Math.cos(rad) * len * 0.5;
  const tailY = cy - Math.sin(rad) * len * 0.5;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - headLen * Math.cos(rad - headAngle),
    tipY - headLen * Math.sin(rad - headAngle),
  );
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - headLen * Math.cos(rad + headAngle),
    tipY - headLen * Math.sin(rad + headAngle),
  );
  ctx.stroke();
}

export function Vector({
  directions,
  group = 0,
  index = 0,
  color = '#c0392b',
  minSize = 4,
  maxSize = 10,
}: VectorProps): null {
  const store = useStore();

  useDrawHook(({ ctx, valToX, valToY }) => {
    const dataGroup = store.dataStore.data[group];
    if (dataGroup == null) return;

    const xArr = dataGroup.x;
    const yArr = dataGroup.series[index];
    if (yArr == null) return;

    // Find y range for size normalization
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i < yArr.length; i++) {
      const v = yArr[i];
      if (v != null) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
    const yRange = yMax - yMin || 1;

    const yScaleId = store.seriesConfigs.find(
      s => s.group === group && s.index === index,
    )?.yScale ?? 'y';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (let i = 0; i < xArr.length; i++) {
      const yVal = yArr[i];
      const dir = directions[i];
      if (yVal == null || dir == null) continue;

      const px = valToX(xArr[i] as number);
      const py = valToY(yVal, yScaleId);
      if (px == null || py == null) continue;

      const t = (yVal - yMin) / yRange;
      const arrowSize = minSize + t * (maxSize - minSize);
      drawArrow(ctx, px, py, dir, arrowSize);
    }
  });

  return null;
}
