import type { Mock } from 'vitest';
import { vi } from 'vitest';
import type { PathCall, Path2DMock } from '../setup';

/** A CanvasRenderingContext2D where every method is a Vitest mock. */
export interface MockCtx extends CanvasRenderingContext2D {
  // Re-declare methods as mocks so `.mock.calls` works in tests
  save: Mock;
  restore: Mock;
  beginPath: Mock;
  moveTo: Mock;
  lineTo: Mock;
  stroke: Mock;
  fill: Mock;
  arc: Mock;
  rect: Mock;
  clip: Mock;
  closePath: Mock;
  clearRect: Mock;
  fillRect: Mock;
  strokeRect: Mock;
  fillText: Mock;
  strokeText: Mock;
  setLineDash: Mock;
  getLineDash: Mock;
  scale: Mock;
  translate: Mock;
  rotate: Mock;
  setTransform: Mock;
  measureText: Mock;
  drawImage: Mock;
  getImageData: Mock;
  putImageData: Mock;
  createImageData: Mock;
  [key: string]: unknown;
}

/**
 * Create a mock CanvasRenderingContext2D with vi.fn() spies on all methods.
 * Absorbs the `ctx as unknown as CanvasRenderingContext2D` double-cast pattern.
 */
export function createMockCtx(): MockCtx {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    canvas: null,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
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
  } as unknown as MockCtx;
}

/**
 * Extract recorded calls from a Path2D mock instance.
 */
export function getMockCalls(path: Path2D): PathCall[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (path as unknown as Path2DMock)._calls;
}

/**
 * Create a typed tuple from arguments, avoiding `[a, b] as [number, number]`.
 */
export function tuple<T extends readonly unknown[]>(...args: T): T { return args; }
