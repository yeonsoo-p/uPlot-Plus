import { useDrawHook } from '../hooks/useDrawHook';

/** Default color map: dark blue → cyan → green → yellow → orange → red → dark red */
function defaultColorMap(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  // 7-stop gradient for high color resolution
  const stops: Array<[number, number, number, number]> = [
    [0.0, 15, 30, 80],     // dark blue
    [0.15, 30, 100, 200],   // blue
    [0.3, 40, 190, 210],   // cyan
    [0.45, 50, 200, 80],   // green
    [0.6, 230, 220, 40],   // yellow
    [0.75, 240, 140, 30],   // orange
    [0.9, 220, 40, 30],    // red
    [1.0, 120, 10, 10],    // dark red
  ];

  // Find the two surrounding stops
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  if (lo == null || hi == null) return 'rgb(0,0,0)';
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (s0 != null && s1 != null && c >= s0[0] && c <= s1[0]) {
      lo = s0;
      hi = s1;
      break;
    }
  }

  const f = hi[0] === lo[0] ? 0 : (c - lo[0]) / (hi[0] - lo[0]);
  const r = Math.round(lo[1] + f * (hi[1] - lo[1]));
  const g = Math.round(lo[2] + f * (hi[2] - lo[2]));
  const b = Math.round(lo[3] + f * (hi[3] - lo[3]));
  return `rgb(${r},${g},${b})`;
}

export interface HeatmapProps {
  /** 2D grid of values: grid[row][col]. Rows map to x-cells, columns to y-cells. */
  grid: number[][];
  /** X-axis value range [min, max]. Default: [0, grid.length] */
  xRange?: [number, number];
  /** Y-axis value range [min, max]. Default: [0, maxBuckets * bucketHeight] */
  yRange?: [number, number];
  /** Color mapping function: (normalizedValue: 0..1) => CSS color string */
  colorMap?: (t: number) => string;
  /** Y scale to use (default: 'y') */
  yScale?: string;
}

export function Heatmap({
  grid,
  xRange,
  yRange,
  colorMap = defaultColorMap,
  yScale: yScaleId = 'y',
}: HeatmapProps): null {
  useDrawHook(({ ctx, valToX, valToY }) => {
    if (grid.length === 0) return;

    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    if (cols === 0) return;

    // Determine ranges
    const xMin = xRange?.[0] ?? 0;
    const xMax = xRange?.[1] ?? rows;
    const yMin = yRange?.[0] ?? 0;
    const yMax = yRange?.[1] ?? cols;

    const xStep = (xMax - xMin) / rows;
    const yStep = (yMax - yMin) / cols;

    // Find max value for normalization
    let maxVal = 0;
    for (const row of grid) {
      for (const v of row) {
        if (v > maxVal) maxVal = v;
      }
    }
    if (maxVal === 0) return;

    for (let r = 0; r < rows; r++) {
      const row = grid[r];
      if (row == null) continue;

      const x0 = valToX(xMin + r * xStep);
      const x1 = valToX(xMin + (r + 1) * xStep);
      if (x0 == null || x1 == null) continue;
      const cellW = x1 - x0;

      for (let c = 0; c < cols; c++) {
        const val = row[c] ?? 0;
        const cellYLo = yMin + c * yStep;
        const cellYHi = yMin + (c + 1) * yStep;

        const y0 = valToY(cellYHi, yScaleId);
        const y1 = valToY(cellYLo, yScaleId);
        if (y0 == null || y1 == null) continue;
        const cellH = y1 - y0;

        ctx.fillStyle = colorMap(val / maxVal);
        ctx.fillRect(x0, y0, cellW, cellH);
      }
    }
  });

  return null;
}
