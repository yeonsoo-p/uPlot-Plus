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
  /** Flags consumed by the current redraw cycle (available to the callback). */
  private consumed: number = DirtyFlag.None;

  /** Mark one or more dirty flags */
  mark(flag: DirtyFlag): void {
    this.flags |= flag;
    this.scheduleFrame();
  }

  /** Check if a specific flag is set */
  has(flag: DirtyFlag): boolean {
    return ((this.flags | this.consumed) & flag) !== 0;
  }

  /** Get current flags value */
  get dirty(): number {
    return this.flags | this.consumed;
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
      // Move flags into consumed so the callback can read them via `dirty`,
      // while any mark() issued during the callback accumulates into `flags`
      // and is not lost.
      this.consumed = this.flags;
      this.flags = DirtyFlag.None;
      const cb = this.callback;
      if (cb != null) {
        cb();
      }
      this.consumed = DirtyFlag.None;
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
