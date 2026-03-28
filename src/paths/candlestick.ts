import type { DrawCallback } from '../types/hooks';
import type { ScaleState } from '../types';
import { valToPos, isScaleReady } from '../core/Scale';

export interface CandlestickOpts {
  /** X values array */
  xValues: ArrayLike<number>;
  /** Open values array */
  open: ArrayLike<number | null>;
  /** High values array */
  high: ArrayLike<number | null>;
  /** Low values array */
  low: ArrayLike<number | null>;
  /** Close values array */
  close: ArrayLike<number | null>;
  /** X scale state — must have min/max set */
  xScale: ScaleState;
  /** Y scale state — must have min/max set */
  yScale: ScaleState;
  /** Color for up candles (close >= open) */
  upColor?: string;
  /** Color for down candles (close < open) */
  downColor?: string;
  /** Body width as fraction of available space (default 0.6) */
  bodyWidth?: number;
  /** Wick width in CSS pixels (default 1) */
  wickWidth?: number;
}

/**
 * Creates a DrawCallback that renders candlestick (OHLC) candles.
 * Use with the Chart's `onDraw` prop or `useDrawHook`.
 *
 * The caller must provide the data arrays and scale states directly
 * since DrawCallback only receives { ctx, plotBox, pxRatio }.
 */
export function drawCandlesticks(opts: CandlestickOpts): DrawCallback {
  return ({ ctx, plotBox, pxRatio }) => {
    const {
      xValues, open, high, low, close,
      xScale, yScale,
      upColor = '#26a69a',
      downColor = '#ef5350',
      bodyWidth = 0.6,
      wickWidth = 1,
    } = opts;

    if (!isScaleReady(xScale)) return;
    if (!isScaleReady(yScale)) return;

    const n = xValues.length;
    if (n === 0) return;

    const candleW = Math.max(2, (plotBox.width / n) * bodyWidth) * pxRatio;
    const halfW = candleW / 2;

    ctx.save();

    for (let i = 0; i < n; i++) {
      const xv = xValues[i];
      const o = open[i];
      const h = high[i];
      const l = low[i];
      const c = close[i];

      if (xv == null || o == null || h == null || l == null || c == null) continue;

      const cx = valToPos(xv, xScale, plotBox.width, plotBox.left) * pxRatio;
      const oPx = valToPos(o, yScale, plotBox.height, plotBox.top) * pxRatio;
      const hPx = valToPos(h, yScale, plotBox.height, plotBox.top) * pxRatio;
      const lPx = valToPos(l, yScale, plotBox.height, plotBox.top) * pxRatio;
      const cPx = valToPos(c, yScale, plotBox.height, plotBox.top) * pxRatio;

      const isUp = c >= o;
      const color = isUp ? upColor : downColor;

      // Wick (high to low)
      ctx.strokeStyle = color;
      ctx.lineWidth = wickWidth * pxRatio;
      ctx.beginPath();
      ctx.moveTo(cx, hPx);
      ctx.lineTo(cx, lPx);
      ctx.stroke();

      // Body (open to close)
      const bodyTop = Math.min(oPx, cPx);
      const bodyH = Math.abs(cPx - oPx);
      ctx.fillStyle = color;
      ctx.fillRect(cx - halfW, bodyTop, halfW * 2, Math.max(bodyH, 1 * pxRatio));
    }

    ctx.restore();
  };
}
