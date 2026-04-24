import type { BBox } from './common';
import type { CursorState } from './cursor';
import type { ScaleState } from './scales';

/** Context passed to draw callbacks — everything needed to draw on the canvas.
 *
 * The canvas context is pre-configured by the library:
 * - **Clipped** to the plot area (persistent hooks only) — drawing outside is impossible
 * - **Scaled** by `pxRatio` — all coordinates are in CSS pixels, not device pixels
 *
 * Use `project()` for orientation-safe (xVal, yVal) → screen (px, py) conversion.
 * `valToX` / `valToY` remain for simple single-scale lookups; they compute the
 * position along each scale's own axis and only match screen X/Y when the scale
 * keeps its default orientation (x=Horizontal, y=Vertical). For charts that use
 * `horizontalBars()` or otherwise flip scale `ori`, prefer `project()`.
 */
export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  plotBox: BBox;
  pxRatio: number;
  /** Get a live scale state by id (reflects current zoom/pan). */
  getScale: (id: string) => ScaleState | undefined;
  /** Convert a data value to CSS pixel position along the scale's own axis.
   *  Returns `null` if scale is not ready. Matches screen X only when the scale is Horizontal. */
  valToX: (val: number, scaleId?: string) => number | null;
  /** Convert a data value to CSS pixel position along the scale's own axis.
   *  Returns `null` if scale is not ready. Matches screen Y only when the scale is Vertical. */
  valToY: (val: number, scaleId: string) => number | null;
  /** Orientation-aware projection: maps (xVal, yVal) → CSS pixel screen (px, py).
   *  Handles transposed charts (where xScale.ori=Vertical) by swapping axes.
   *  Returns `null` if either scale is missing or not ready. */
  project: (xVal: number, yVal: number, xScaleId?: string, yScaleId?: string) => { px: number; py: number } | null;
}

/** Callback that draws persistent content (included in snapshot, not redrawn on cursor move). */
export type DrawCallback = (dc: DrawContext) => void;

/** Callback that draws on the cursor overlay (redrawn every frame). */
export type CursorDrawCallback = (dc: DrawContext, cursor: CursorState) => void;
