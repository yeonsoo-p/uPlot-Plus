import React from 'react';
import { useDrawHook } from '../hooks/useDrawHook';
import { useStore } from '../hooks/useChart';
import { drawRangeBox } from '../rendering/drawRangeBox';
import { Scale } from './Scale';
import { Series } from './Series';

export interface BoxWhiskerProps {
  /** Array of box data — one per category. */
  boxes: Array<{ min: number; q1: number; median: number; q3: number; max: number }>;
  /** Y scale to use (default: 'y') */
  yScale?: string;
  /** Box width as fraction of category spacing (default: 0.5) */
  boxWidth?: number;
  /** Box fill color (default: 'rgba(52, 152, 219, 0.4)') */
  fill?: string;
  /** Box stroke color (default: '#2980b9') */
  stroke?: string;
  /** Median line color (default: '#e74c3c') */
  medianColor?: string;
  /** Whisker color (default: '#555') */
  whiskerColor?: string;
  /** Auto-provision x/y scales from box data (default: true). Set false for manual control. */
  autoScales?: boolean;
  /** When true, internal placeholder series appear in legend and are toggleable (default: false) */
  exposeUnderlyingSeries?: boolean;
}

export function BoxWhisker({
  boxes,
  yScale: yScaleId = 'y',
  boxWidth = 0.5,
  fill: fillProp,
  stroke: strokeProp,
  medianColor: medianProp,
  whiskerColor: whiskerProp,
  autoScales = true,
  exposeUnderlyingSeries = false,
}: BoxWhiskerProps): React.ReactElement {
  const store = useStore();
  const fill = fillProp ?? store.theme.boxFill;
  const stroke = strokeProp ?? store.theme.boxStroke;
  const medianColor = medianProp ?? store.theme.boxMedian;
  const whiskerColor = whiskerProp ?? store.theme.boxWhisker;

  useDrawHook(({ ctx, plotBox, valToX, valToY }) => {
    const w = (plotBox.width / boxes.length) * boxWidth;
    const capW = w * 0.3;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b == null) continue;

      const cx = valToX(i + 1);
      const minPx = valToY(b.min, yScaleId);
      const q1Px = valToY(b.q1, yScaleId);
      const medPx = valToY(b.median, yScaleId);
      const q3Px = valToY(b.q3, yScaleId);
      const maxPx = valToY(b.max, yScaleId);
      if (cx == null || minPx == null || q1Px == null || medPx == null || q3Px == null || maxPx == null) continue;

      drawRangeBox(ctx, cx, minPx, maxPx, q1Px, q3Px, w, medPx, {
        wickColor: whiskerColor,
        bodyFill: fill,
        bodyStroke: stroke,
        capWidth: capW,
        midColor: medianColor,
      });
    }
  });

  if (!autoScales || boxes.length === 0) return <></>;

  // Infer y-domain from box min/max with 10% padding
  let yMin = Infinity, yMax = -Infinity;
  for (const b of boxes) {
    if (b.min < yMin) yMin = b.min;
    if (b.max > yMax) yMax = b.max;
  }
  const pad = (yMax - yMin) * 0.1 || 1;

  return (
    <>
      <Scale id="x" auto={false} min={0.5} max={boxes.length + 0.5} />
      <Scale id={yScaleId} auto={false} min={yMin - pad} max={yMax + pad} />
      <Series group={0} index={0} yScale={yScaleId} show={false}
        _internal={!exposeUnderlyingSeries} />
    </>
  );
}
