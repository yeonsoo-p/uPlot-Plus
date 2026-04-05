/**
 * Vitest setup: mocks for Path2D, Canvas context, rAF, and ResizeObserver
 * that jsdom does not provide.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => { cleanup(); });

// ---- ResizeObserver mock ----
class ResizeObserverMock {
  observe() { /* noop */ }
  unobserve() { /* noop */ }
  disconnect() { /* noop */ }
}
(globalThis as any).ResizeObserver = ResizeObserverMock;

// ---- Path2D mock with call recording ----
export type PathCall =
  | ['moveTo', number, number]
  | ['lineTo', number, number]
  | ['rect', number, number, number, number]
  | ['arc', number, number, number, number, number]
  | ['closePath']
  | ['addPath']
  | ['bezierCurveTo', number, number, number, number, number, number]
  | ['quadraticCurveTo', number, number, number, number];

export class Path2DMock {
  _calls: PathCall[] = [];

  constructor(source?: Path2DMock) {
    if (source) {
      this._calls = [...source._calls];
    }
  }

  moveTo(x: number, y: number): void { this._calls.push(['moveTo', x, y]); }
  lineTo(x: number, y: number): void { this._calls.push(['lineTo', x, y]); }
  rect(x: number, y: number, w: number, h: number): void { this._calls.push(['rect', x, y, w, h]); }
  arc(x: number, y: number, r: number, s: number, e: number): void { this._calls.push(['arc', x, y, r, s, e]); }
  closePath(): void { this._calls.push(['closePath']); }
  addPath(_path: Path2DMock): void { this._calls.push(['addPath']); }
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this._calls.push(['bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y]);
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this._calls.push(['quadraticCurveTo', cpx, cpy, x, y]);
  }
}

(globalThis as any).Path2D = Path2DMock;

// ---- CanvasRenderingContext2D stub ----
function createContextStub(): Record<string, unknown> {
  return {
    // State
    save() { /* noop */ },
    restore() { /* noop */ },

    // Transform
    scale(_x: number, _y: number) { /* noop */ },
    translate(_x: number, _y: number) { /* noop */ },
    rotate(_angle: number) { /* noop */ },
    setTransform() { /* noop */ },

    // Drawing
    beginPath() { /* noop */ },
    closePath() { /* noop */ },
    moveTo(_x: number, _y: number) { /* noop */ },
    lineTo(_x: number, _y: number) { /* noop */ },
    arc(_x: number, _y: number, _r: number, _s: number, _e: number) { /* noop */ },
    rect(_x: number, _y: number, _w: number, _h: number) { /* noop */ },
    bezierCurveTo() { /* noop */ },
    quadraticCurveTo() { /* noop */ },

    // Rendering
    fill() { /* noop */ },
    stroke() { /* noop */ },
    clip() { /* noop */ },
    clearRect(_x: number, _y: number, _w: number, _h: number) { /* noop */ },
    fillRect(_x: number, _y: number, _w: number, _h: number) { /* noop */ },
    strokeRect(_x: number, _y: number, _w: number, _h: number) { /* noop */ },
    drawImage() { /* noop */ },

    // Text
    fillText(_text: string, _x: number, _y: number) { /* noop */ },
    strokeText(_text: string, _x: number, _y: number) { /* noop */ },
    measureText(text: string) {
      return { width: text.length * 7 };
    },

    // Line
    setLineDash(_segments: number[]) { /* noop */ },
    getLineDash() { return []; },

    // Image data
    getImageData(_sx: number, _sy: number, sw: number, sh: number) {
      return { data: new Uint8ClampedArray(sw * sh * 4), width: sw, height: sh };
    },
    putImageData() { /* noop */ },
    createImageData(sw: number, sh: number) {
      return { data: new Uint8ClampedArray(sw * sh * 4), width: sw, height: sh };
    },

    // Properties (writable)
    canvas: null,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    lineDashOffset: 0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };
}

// Override getContext on HTMLCanvasElement
const origGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: any[]) {
  if (contextId === '2d') {
    return createContextStub() as any;
  }
  return origGetContext.call(this, contextId as any, ...args);
} as typeof origGetContext;

// ---- requestAnimationFrame / cancelAnimationFrame ----
let rafId = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();

globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
  const id = ++rafId;
  rafCallbacks.set(id, cb);
  // Execute synchronously via microtask for deterministic tests
  void Promise.resolve().then(() => {
    const fn = rafCallbacks.get(id);
    if (fn) {
      rafCallbacks.delete(id);
      fn(performance.now());
    }
  });
  return id;
};

globalThis.cancelAnimationFrame = (id: number): void => {
  rafCallbacks.delete(id);
};
