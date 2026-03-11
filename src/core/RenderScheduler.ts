import { DirtyFlag } from '../types/common';

/**
 * Render scheduler with dirty-flag tracking.
 * Accumulates dirty flags between frames and coalesces redraws
 * via requestAnimationFrame to avoid redundant work.
 */
export class RenderScheduler {
  private flags: number = DirtyFlag.None;
  private frameId: number | null = null;
  private callback: (() => void) | null = null;

  /** Mark one or more dirty flags */
  mark(flag: DirtyFlag): void {
    this.flags |= flag;
    this.scheduleFrame();
  }

  /** Check if a specific flag is set */
  has(flag: DirtyFlag): boolean {
    return (this.flags & flag) !== 0;
  }

  /** Get current flags value */
  get dirty(): number {
    return this.flags;
  }

  /** Clear all flags (called after a redraw) */
  clear(): void {
    this.flags = DirtyFlag.None;
  }

  /** Set the redraw callback */
  onRedraw(cb: () => void): void {
    this.callback = cb;
  }

  /** Schedule a frame if not already pending */
  private scheduleFrame(): void {
    if (this.frameId != null) return;

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      const cb = this.callback;
      if (cb != null) {
        cb();
      }
      this.clear();
    });
  }

  /** Cancel any pending frame */
  cancel(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /** Clean up */
  dispose(): void {
    this.cancel();
    this.callback = null;
    this.flags = DirtyFlag.None;
  }
}
