import type { BBox } from './common';
import type { CursorState } from './cursor';

/** Context passed to draw callbacks — everything needed to draw on the canvas. */
export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  plotBox: BBox;
  pxRatio: number;
}

/** Callback that draws persistent content (included in snapshot, not redrawn on cursor move). */
export type DrawCallback = (dc: DrawContext) => void;

/** Callback that draws on the cursor overlay (redrawn every frame). */
export type CursorDrawCallback = (dc: DrawContext, cursor: CursorState) => void;
