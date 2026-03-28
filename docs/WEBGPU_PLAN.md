# WebGPU Rendering Backend for uPlot-Plus

## 1. Context

The library renders everything via Canvas 2D (`CanvasRenderingContext2D` + `Path2D`). The goal is to add a WebGPU rendering backend that produces visually identical output with the same public API, and falls back to Canvas 2D when WebGPU is unavailable.

**Why**: WebGPU enables GPU-accelerated rendering of series geometry, which matters for charts with large datasets (100k+ points) where Canvas 2D's CPU-bound path stroking becomes a bottleneck. The GPU excels at batched line/fill rendering.

**Prerequisite**: The CPU-only optimizations in [PERF_PLAN.md](PERF_PLAN.md) (LTTB downsampling, streaming buffers, cache improvements) should be implemented first — they have the largest impact and benefit both Canvas 2D and WebGPU backends. This plan assumes LTTB is already in place, reducing visible data from O(n) to O(pixels) before path building.

**Reference**: ChartGPU (`/home/user/workspace/ChartGPU`) achieves 50M+ points at 60fps using this combined approach — LTTB downsampling before iteration, plus GPU rendering.

---

## 2. Core Architecture

### 2.1. Performance Context

See [PERF_PLAN.md](PERF_PLAN.md) for the full bottleneck analysis and CPU-only optimizations. The key takeaway for this plan:

After LTTB downsampling reduces visible data from O(n) to O(pixels), the remaining bottleneck is **Canvas 2D's CPU-bound `ctx.stroke()`/`ctx.fill()`** — which takes ~3-10ms for complex paths. WebGPU replaces this with GPU-accelerated rendering, bringing total frame time well under 16.6ms even for complex multi-series charts.

### 2.2 Canvas Stack

WebGPU mode uses three canvases layered in a single container div. Canvas 2D mode continues using a single canvas.

```
┌────────────────────────────────────────────────────┐
│  Container div (position: relative)                │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ 1. WebGPU canvas (bottom)                    │  │
│  │    Series strokes/fills, grid lines, bands,  │  │
│  │    data points, selection rectangle           │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 2. Draw-hook canvas (middle, Canvas 2D)      │  │
│  │    useDrawHook output, annotations,          │  │
│  │    Timeline segments — persistent layer       │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 3. Overlay canvas (top, Canvas 2D)           │  │
│  │    Cursor crosshair, point indicator,        │  │
│  │    useCursorDrawHook output, axis text        │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  HTML overlays (Legend, Tooltip, FloatingLegend,   │
│  HoverLabel) — purely React, no canvas             │
└────────────────────────────────────────────────────┘
```

**Why three canvases**: The current rendering contract has a strict Z-ordering: series (bottom) → draw hooks → cursor/selection (top). Draw hooks are included in the snapshot for cursor-only fast redraws. A two-canvas approach (WebGPU + text overlay) would break this: hooks on the overlay canvas would render above the cursor (wrong Z-order) and would not be included in the GPU snapshot, forcing re-execution of all draw hooks on every cursor move. Three canvases preserve layering and snapshot semantics exactly.

**Canvas properties**:
- All three: `position: absolute; left: 0; top: 0`
- Draw-hook canvas: `pointer-events: none`
- Overlay canvas: `pointer-events: none`
- Interaction events are captured by the container div (already the case today)
- Canvas 2D canvases use standard `getContext('2d')`, sized at `width * pxRatio` × `height * pxRatio` physical pixels

### 2.3 RenderPipeline Interface

The central abstraction. Captures both frame-level orchestration and leaf drawing operations, replacing the ~280-line `redraw()` function's direct `ctx.*` calls.

```ts
interface RenderPipeline {
  // Lifecycle
  init(canvases: CanvasConfig, pxRatio: number): void;
  dispose(): void;
  resize(width: number, height: number, pxRatio: number): void;

  // Frame
  beginFrame(width: number, height: number, pxRatio: number): void;
  endFrame(): void;

  // Plot area clipping
  beginPlotClip(plotBox: BBox, pxRatio: number): void;
  endPlotClip(): void;

  // Series geometry (called inside plot clip)
  setSeriesAlpha(alpha: number): void;   // focus dimming
  resetSeriesAlpha(): void;
  drawSeriesPath(paths: SeriesPaths, style: SeriesStyle): void;
  drawBandFill(bandData: BandDrawData, fill: string): void;
  drawDataPoints(pointData: PointDrawData): void;

  // Axes and grid (called before plot clip)
  drawAxesGrid(axisStates: AxisState[], getScale: GetScaleFn,
               plotBox: BBox, pxRatio: number, title?: string): void;

  // Cursor and selection (called after plot clip)
  drawCursor(state: CursorState, plotBox: BBox, pxRatio: number,
             data: XGroup[], seriesConfigs: SeriesConfig[],
             getScale: GetScaleFn,
             getGroupXScaleKey: (gi: number) => string,
             seriesConfigMap: SeriesConfigMap): void;
  drawSelection(state: SelectState, plotBox: BBox, pxRatio: number): void;

  // Snapshot (cursor-only fast redraws)
  saveSnapshot(width: number, height: number): void;
  restoreSnapshot(): boolean;
  invalidateSnapshot(): void;

  // Draw hooks — return contexts for user callbacks
  getDrawHookContext(plotBox: BBox, pxRatio: number,
                     getScale: GetScaleFn): DrawContext;
  getCursorDrawHookContext(plotBox: BBox, pxRatio: number,
                           getScale: GetScaleFn): DrawContext;
}
```

**Why this interface shape**: The current `redraw()` in `useChartStore.ts` interleaves ctx state management (save/restore, scale, clip, globalAlpha) with drawing calls across 6 imported draw functions. Extracting just the leaf draw calls leaves the orchestrator still coupled to Canvas 2D. The pipeline interface captures the full frame lifecycle so `redraw()` becomes a pure sequence of pipeline calls with no direct `ctx.*` usage.

**Canvas2DPipeline**: Implements the interface by wrapping existing draw functions. Single canvas, same behavior as today. All existing `drawSeries.ts`, `drawAxes.ts`, `drawCursor.ts`, `drawSelect.ts`, `drawBands.ts`, `drawPoints.ts` logic is absorbed here.

**WebGPUPipeline**: Implements the interface using the three-canvas stack. GPU for series geometry/grid; Canvas 2D contexts for hooks and overlays.

### 2.4 redraw() Refactoring

The `redraw()` function in `useChartStore.ts` (lines 318-597) becomes a backend-agnostic orchestrator. Current flow with ~20 direct `ctx.*` calls:

```
ctx.clearRect → ctx.save → ctx.scale → drawAxesGrid(ctx) →
ctx.beginPath → ctx.rect → ctx.clip → [series loop with ctx.globalAlpha] →
drawBands(ctx) → drawPoints(ctx) → ctx.restore →
ctx.save → ctx.clip → ctx.scale → [draw hooks] → ctx.restore →
saveSnapshot → drawCursor(ctx) → drawSelection(ctx) →
ctx.save → ctx.scale → [cursor hooks] → ctx.restore
```

Refactored flow with zero direct `ctx.*` calls:

```
pipeline.beginFrame(width, height, pxRatio)
pipeline.drawAxesGrid(axisStates, getScale, plotBox, pxRatio, title)
pipeline.beginPlotClip(plotBox, pxRatio)
  for each series:
    if dimmed: pipeline.setSeriesAlpha(focusAlpha)
    renderer.drawSeries(info, plotBox, pxRatio)   // uses pipeline internally
    if dimmed: pipeline.resetSeriesAlpha()
  for each band: pipeline.drawBandFill(bandData, fill)
  for each series with points: pipeline.drawDataPoints(pointData)
pipeline.endPlotClip()
// Draw hooks (persistent)
dc = pipeline.getDrawHookContext(plotBox, pxRatio, getScale)
for fn of drawHooks: fn(dc)
// Snapshot
pipeline.saveSnapshot(width * pxRatio, height * pxRatio)
// Cursor overlay
pipeline.drawCursor(cursorState, plotBox, pxRatio, ...)
pipeline.drawSelection(selectState, plotBox, pxRatio)
// Cursor draw hooks
cdc = pipeline.getCursorDrawHookContext(plotBox, pxRatio, getScale)
for fn of cursorDrawHooks: fn(cdc, cursorState)
pipeline.endFrame()
```

**Cursor-only fast path**: The dirty-flag detection (`(dirty & ~(DirtyFlag.Cursor | DirtyFlag.Select)) === 0`) remains unchanged. On cursor-only redraws, the pipeline restores the snapshot (GPU texture blit + draw-hook canvas restore) then redraws only cursor/selection/cursor-hooks.

### 2.5 Path Builder GPU Tessellation

Path builders currently emit `SeriesPaths` containing `Path2D` objects. Since `Path2D` does not expose its internal geometry, there is no way to extract vertices after the fact. The tessellation strategy:

**Separate GPU path cache**: The WebGPU backend maintains a `GPUPathCache` internally, keyed by the same `"group:index:i0:i1"` scheme as the existing LRU cache. It stores `TessellatedPaths` and corresponding `GPUBuffer` objects. Evicted when the corresponding `SeriesPaths` entry is evicted. `SeriesPaths` itself is **not modified** — no `Float32Array` fields are added.

```ts
interface TessellatedPaths {
  strokeCoords: Float32Array;   // [x0,y0, x1,y1, ...] pixel-space line strip
  fillCoords?: Float32Array;    // fill polygon vertices
  fillIndices?: Uint32Array;    // triangle indices from monotone triangulation
}
```

**Tessellation approach by builder type**:

| Builder | Path2D methods used | GPU tessellation strategy |
|---------|-------------------|--------------------------|
| `linear.ts` | `lineTo` | Direct: capture pixel coords from `pixelForX`/`pixelForY` into `Float32Array` during the existing iteration loop. Decimation logic produces the same min/max/in/out vertices. |
| `stepped.ts` | `lineTo` | Direct: capture step segment endpoints. Same iteration, emit horizontal then vertical segments. |
| `bars.ts` | `rect`, `arc` (rounded) | Direct: emit quad vertices per bar. Rounded corners via arc approximation (8-16 segments per corner). |
| `monotoneCubic.ts` | `bezierCurveTo` | Adaptive de Casteljau subdivision with ~0.5 device-pixel flatness tolerance. Recursively subdivide cubic Bezier until each segment is flat enough. Guaranteed O(n log(1/ε)) vertices. |
| `catmullRom.ts` | `bezierCurveTo` | Same adaptive subdivision as monotone cubic. |
| `points.ts` | `arc` (full circle) | Emit circle center + radius. GPU renders via SDF in fragment shader (single quad per point, instanced). |
| `candlestick.ts` | Direct `ctx.*` calls | Stays on Canvas 2D (draw-hook canvas). Candlestick is a `DrawCallback`, not a `PathBuilder`. Renders through `useDrawHook` unchanged. |

**Fill triangulation**: Series fill polygons are monotone with respect to the X axis (stroke path goes left-to-right, then baseline returns right-to-left). O(n) monotone polygon triangulation — no third-party dependency needed. The `triangulate.ts` module implements this directly.

**Fallback for unconverted builders**: Path builders that have not yet been converted to emit coordinate arrays fall back to Canvas 2D rendering for that series. The `WebGPUPipeline` draws those series on the draw-hook canvas (middle Canvas 2D) instead of the GPU canvas. A `console.warn` is emitted once per unconverted builder type. This is visually correct and avoids a `tessellateFromPath2D` shim — which is not feasible since `Path2D` does not expose its geometry.

### 2.6 Snapshot System

**Current (Canvas 2D)**: `CanvasRenderer` saves/restores via `OffscreenCanvas.drawImage()`. Snapshot includes: series + bands + points + draw hook output. Cursor/selection are drawn on top after restore. Snapshot is invalidated on visibility toggle, cache clear, or data change.

**WebGPU mode**: Two-part snapshot:
1. GPU content → `copyTextureToTexture()` to a retained `GPUTexture` (near-instant)
2. Draw-hook canvas → `drawImage()` to a retained offscreen canvas (same as today)

Cursor-only restore:
1. Blit GPU snapshot texture via fullscreen quad + `blit.wgsl` shader
2. Restore draw-hook canvas from offscreen snapshot
3. Clear overlay canvas, redraw cursor/selection/cursor-hooks

**Invariant preserved**: Draw hook output persists across cursor-only redraws without re-executing hooks.

### 2.7 DrawContext Compatibility

`DrawContext` is the public API for user hooks. It exposes `ctx: CanvasRenderingContext2D` directly.

| Hook type | Canvas context source | Pre-applied state | Snapshot inclusion |
|-----------|----------------------|-------------------|--------------------|
| `useDrawHook` | Draw-hook canvas (middle) | Clipped to plot area, scaled by `pxRatio` | Yes |
| `useCursorDrawHook` | Overlay canvas (top) | Scaled by `pxRatio`, **not clipped** | No |

**All existing consumers work unchanged**:
- `annotations.ts` (`drawHLine`, `drawVLine`, `drawLabel`, `drawRegion`) — use `ctx.beginPath/moveTo/lineTo/stroke/fillText/fillRect` on the draw-hook canvas. No coordinate system changes.
- `HLine.tsx`, `VLine.tsx`, `Region.tsx`, `AnnotationLabel.tsx` — register via `useDrawHook`, receive draw-hook canvas context.
- `Timeline.tsx` — registers via `useDrawHook`, applies its own `ctx.clip()` and pxRatio scaling. Works on draw-hook canvas unchanged.
- `candlestick.ts` — `DrawCallback` that draws wicks/bodies via `ctx.moveTo/lineTo/stroke/fillRect`. Works on draw-hook canvas unchanged.

**Caveat**: `Timeline.tsx` manually multiplies all coordinates by `pxRatio` (unlike annotation helpers which assume the context is pre-scaled). This pattern works on both backends because both provide a pre-scaled context — Timeline's explicit multiplication is redundant but harmless, producing correct device-pixel output.

### 2.8 WebGPU Lifecycle

**Async initialization**: `requestAdapter()` and `requestDevice()` are async. The chart cannot wait for them before rendering the first frame.

Strategy:
1. At mount, immediately create `Canvas2DPipeline` and render normally
2. If `renderer` prop is `'auto'` or `'webgpu'`, kick off GPU initialization in the background
3. When `GPUDevice` is ready, create `WebGPUPipeline`, swap it in, trigger full redraw
4. No flash of empty content; first frame always renders via Canvas 2D

**Device loss**: `GPUDevice` can be lost (tab backgrounded, driver crash, GPU reset, system sleep). All GPU resources become invalid.

Strategy:
1. Listen on `device.lost` promise
2. On loss: swap to `Canvas2DPipeline`, invalidate `GPUPathCache`, trigger full redraw
3. Retry GPU initialization after 1s, then exponential backoff (2s, 4s, 8s, max 30s)
4. On recovery: swap back to `WebGPUPipeline`

**`renderer` prop**: `renderer?: 'auto' | 'canvas2d' | 'webgpu'` on `ChartProps`.
- `'auto'` (default): prefer WebGPU, fall back to Canvas 2D
- `'canvas2d'`: skip GPU initialization entirely
- `'webgpu'`: use Canvas 2D until GPU ready, then switch (for testing/benchmarking)

### 2.9 Clipping

**Plot area clip**: `renderPassEncoder.setScissorRect()` — trivial, set once per frame.

**Gap clip paths**: `clipGaps()` in `src/paths/utils.ts` produces a `Path2D` of axis-aligned rectangles covering non-gap regions. The current Canvas 2D approach applies this as a single `ctx.clip(paths.clip)`.

WebGPU approach:
- **Few gaps (≤20 regions)**: Render series once per non-gap region with a different scissor rect. Each scissor region slightly overlaps by the line width at boundaries to prevent miter join artifacts.
- **Many gaps (>20 regions)**: Use a stencil buffer. Write the gap mask (inverted — mark gap regions) to the stencil, then draw the series with stencil test. Single draw call regardless of gap count.

### 2.10 GPU Shaders

| Shader | File | Purpose |
|--------|------|---------|
| `line.wgsl` | `src/rendering/webgpu/shaders/` | Line strip → triangle strip expansion. Vertex shader positions strip quads. Fragment shader: SDF anti-aliasing + dash pattern via distance-along-line uniform. Supports variable width, join (miter/bevel), and cap (butt/round/square). |
| `fill.wgsl` | `src/rendering/webgpu/shaders/` | Triangle fill with solid color or gradient. Gradient: uniform struct with up to 8 stops, piecewise linear interpolation by fragment's normalized Y within plot box. |
| `rect.wgsl` | `src/rendering/webgpu/shaders/` | Instanced quad rendering for rectangles (bars, selection). |
| `circle.wgsl` | `src/rendering/webgpu/shaders/` | SDF circle rendering for data points. One instanced quad per point, fragment shader computes signed distance to circle edge for anti-aliased fill + stroke. |
| `blit.wgsl` | `src/rendering/webgpu/shaders/` | Fullscreen textured quad for snapshot restore. Samples retained GPUTexture and writes to framebuffer. |

### 2.11 Gradient Support

Current: `drawSeries.ts` caches `CanvasGradient` objects in a `WeakMap<GradientConfig, {grad, left, top, width, height}>`. Vertical linear gradients only. Invalidated when plotBox dimensions change (object identity keys + bbox validation).

WebGPU: Fragment shader receives gradient stops as a uniform struct. Up to 8 `(offset, r, g, b, a)` entries. Piecewise linear interpolation based on fragment's normalized Y position within the plot box. Cached by gradient config identity + plotBox dimensions (same invalidation semantics).

```wgsl
struct GradientStop { offset: f32, color: vec4<f32> }
struct GradientUniforms {
  stops: array<GradientStop, 8>,
  count: u32,
  plotTop: f32,
  plotHeight: f32,
}
```

### 2.12 Focus Dimming

Current: `ctx.globalAlpha = store.focusAlpha` (default 0.15) applied per-series in the `redraw()` loop.

WebGPU: Multiply the color uniform's alpha channel for non-focused series. `pipeline.setSeriesAlpha(alpha)` updates a uniform buffer field. No blend state change needed — the standard `src * srcAlpha + dst * (1 - srcAlpha)` blend handles it.

### 2.13 Assumptions from PERF_PLAN.md

This plan assumes the following CPU-only optimizations from [PERF_PLAN.md](PERF_PLAN.md) are already in place:

- **LTTB downsampling**: visible data reduced from O(n) to O(pixels) before path building
- **Geometric buffer growth**: streaming appends use power-of-2 allocation
- **Per-axis scale stamps**: y-scale changes don't invalidate x-path caches
- **`sampling` config on SeriesConfig**: `'lttb' | 'none'` controls per-series downsampling

---

## 3. Canvas 2D API Surface

19 files use Canvas 2D APIs. This table documents every direct `ctx.*` consumer and what changes.

### 3.1. Rendering Core (absorbed into pipelines)

| File | `ctx.*` calls | Key operations | WebGPU change |
|------|--------------|----------------|---------------|
| `src/hooks/useChartStore.ts` | ~20 | `clearRect`, `save/restore`, `scale`, `beginPath/rect/clip`, `globalAlpha` | All calls replaced by `RenderPipeline` methods |
| `src/rendering/CanvasRenderer.ts` | ~14 | `clearRect`, `save/restore`, `scale`, `clip`, `drawImage` (snapshot) | Split into backend-agnostic cache + pipeline delegate |
| `src/rendering/drawSeries.ts` | ~18 | `save/restore`, `globalAlpha`, `clip(Path2D)`, `fill/stroke(Path2D)`, `strokeStyle/fillStyle`, `lineWidth/lineJoin/lineCap`, `setLineDash`, `translate`, `createLinearGradient` | Absorbed into `Canvas2DPipeline.drawSeriesPath()`. WebGPU uses shaders for stroke/fill/gradient. |
| `src/rendering/drawAxes.ts` | ~53 | `save/restore`, `translate`, `strokeStyle/lineWidth/setLineDash`, `beginPath/moveTo/lineTo/stroke`, `font/fillStyle/textAlign/textBaseline`, `setTransform/fillText/rotate` | Grid lines → GPU instanced lines. Text → overlay canvas (Canvas 2D). |
| `src/rendering/drawCursor.ts` | ~21 | `save/restore`, `strokeStyle/lineWidth/setLineDash`, `beginPath/moveTo/lineTo/stroke`, `arc/fillStyle/fill` | Stays Canvas 2D on overlay canvas. Cursor is a few draw calls per frame — no GPU benefit. |
| `src/rendering/drawSelect.ts` | ~7 | `save/restore`, `fillStyle/fillRect`, `strokeStyle/lineWidth/strokeRect` | Stays Canvas 2D on overlay canvas. |
| `src/rendering/drawBands.ts` | ~4 | `save/restore`, `fillStyle`, `fill(Path2D)` | GPU fill pipeline for WebGPU mode. |
| `src/rendering/drawPoints.ts` | ~11 | `save/restore`, `strokeStyle/fillStyle/lineWidth/setLineDash`, `beginPath/arc/fill/stroke` | GPU SDF circle instancing for WebGPU mode. |

### 3.2. Path Builders (produce Path2D, don't touch ctx — except candlestick)

| File | Path2D methods | GPU tessellation |
|------|---------------|------------------|
| `src/paths/linear.ts` | `lineTo` | Direct coord capture |
| `src/paths/stepped.ts` | `lineTo` | Direct coord capture |
| `src/paths/bars.ts` | `rect`, `arc`, `lineTo`, `closePath` | Quad vertices + arc approximation |
| `src/paths/monotoneCubic.ts` | `moveTo`, `bezierCurveTo` | Adaptive de Casteljau subdivision |
| `src/paths/catmullRom.ts` | `moveTo`, `bezierCurveTo` | Adaptive de Casteljau subdivision |
| `src/paths/spline.ts` | Delegates to above | Delegates to above |
| `src/paths/points.ts` | `moveTo`, `arc` | SDF circle instancing |
| `src/paths/utils.ts` | `rect`, `lineTo` (clip paths) | Scissor rects / stencil mask |
| `src/paths/candlestick.ts` | Direct `ctx.*` (~10 calls) | Stays Canvas 2D via draw-hook canvas |

### 3.3. Draw Hook Consumers (work unchanged via DrawContext)

| File | `ctx.*` calls | Layer | Notes |
|------|--------------|-------|-------|
| `src/annotations.ts` | ~17 | Persistent | `drawHLine/drawVLine/drawLabel/drawRegion` helpers |
| `src/components/annotations/HLine.tsx` | ~5 | Persistent | Label text via `fillText` |
| `src/components/annotations/VLine.tsx` | ~5 | Persistent | Label text via `fillText` |
| `src/components/annotations/Region.tsx` | 0 | Persistent | Delegates to `drawRegion` |
| `src/components/annotations/AnnotationLabel.tsx` | ~5 | Persistent | Text via `fillText` |
| `src/components/Timeline.tsx` | ~13 | Persistent | Segments + labels, applies own `ctx.clip()` and pxRatio scaling |

### 3.4. HTML-Only Components (no canvas, no changes)

`Legend.tsx`, `FloatingLegend.tsx`, `Tooltip.tsx`, `HoverLabel.tsx` — pure React/HTML overlays using `useSyncExternalStore` for cursor state. Zero canvas interaction.

---

## 4. New Files

| File | Phase | Purpose |
|------|-------|---------|
| `src/rendering/RenderPipeline.ts` | 0 | Interface definition |
| `src/rendering/Canvas2DPipeline.ts` | 0 | Canvas 2D implementation (wraps existing draw functions) |
| `src/rendering/webgpu/WebGPUPipeline.ts` | 1 | WebGPU implementation (three-canvas stack, GPU pipelines) |
| `src/rendering/webgpu/GPUPathCache.ts` | 1 | GPU vertex buffer cache (keyed alongside LRU path cache) |
| `src/rendering/webgpu/lineExpand.ts` | 1 | Line strip → triangle strip expansion (CPU-side) |
| `src/rendering/webgpu/triangulate.ts` | 1 | O(n) monotone polygon triangulation |
| `src/rendering/webgpu/tessellate.ts` | 1 | Adaptive de Casteljau subdivision for Bezier curves |
| `src/rendering/webgpu/shaders/line.wgsl` | 1 | Line rendering shader |
| `src/rendering/webgpu/shaders/fill.wgsl` | 1 | Fill rendering shader |
| `src/rendering/webgpu/shaders/rect.wgsl` | 1 | Instanced rectangle shader |
| `src/rendering/webgpu/shaders/circle.wgsl` | 3 | SDF circle shader for data points |
| `src/rendering/webgpu/shaders/blit.wgsl` | 3 | Fullscreen quad for snapshot restore |
| `src/rendering/webgpu/bufferPool.ts` | 5 | Ring-buffer allocator for GPU buffer reuse |

---

## 5. Modified Files

| File | Phase | Change |
|------|-------|--------|
| `src/hooks/useChartStore.ts` | 0 | `redraw()` refactored to use `RenderPipeline` methods (zero direct `ctx.*` calls) |
| `src/rendering/CanvasRenderer.ts` | 0 | Holds `RenderPipeline` instead of raw `ctx`. Path/band caches stay (backend-agnostic). |
| `src/rendering/drawSeries.ts` | 0 | Absorbed into `Canvas2DPipeline` (file may become thin re-export or removed) |
| `src/rendering/drawAxes.ts` | 0 | Absorbed into `Canvas2DPipeline` |
| `src/rendering/drawCursor.ts` | 0 | Absorbed into `Canvas2DPipeline` |
| `src/rendering/drawSelect.ts` | 0 | Absorbed into `Canvas2DPipeline` |
| `src/rendering/drawBands.ts` | 0 | Absorbed into `Canvas2DPipeline` |
| `src/rendering/drawPoints.ts` | 0 | Absorbed into `Canvas2DPipeline` |
| `src/components/Chart.tsx` | 2 | Three-canvas stack in WebGPU mode; `renderer` prop; async init orchestration |
| `src/types/chart.ts` | 2 | Add `renderer?: 'auto' \| 'canvas2d' \| 'webgpu'` to `ChartProps` |
| `src/types/hooks.ts` | 0 | No change — `DrawContext` interface stays identical |
| `src/paths/types.ts` | 0 | No change — `SeriesPaths` stays identical; `TessellatedPaths` is a new separate type |
| `src/paths/linear.ts` | 1 | Add parallel code path to emit `TessellatedPaths` alongside `Path2D` |
| `src/paths/stepped.ts` | 1 | Same |
| `src/paths/bars.ts` | 1 | Same |
| `src/paths/spline.ts` | 1 | Same (+ adaptive subdivision for Bezier curves) |
| `src/paths/points.ts` | 1 | Same (emit center + radius instead of arc Path2D) |

---

## 6. Phases

**Prerequisite**: Complete [PERF_PLAN.md](PERF_PLAN.md) Phases 0-1 first (LTTB downsampling, streaming optimizations, cache improvements). These are GPU-independent and have the highest impact.

### Phase 0: Rendering Abstraction Layer

**Goal**: Pure refactor — no visual changes, no new rendering backend. Insert the `RenderPipeline` seam.

**Steps**:

1. Define `RenderPipeline` interface in `src/rendering/RenderPipeline.ts`
2. Implement `Canvas2DPipeline` absorbing logic from all 6 draw modules
3. Refactor `CanvasRenderer` to delegate to pipeline
4. Refactor `redraw()` in `useChartStore.ts` to use only pipeline methods
5. Remove direct `ctx.*` calls from orchestration code

**Invariants**:

- All existing tests pass (`npm run test`)
- Typecheck passes (`npm run typecheck`)
- Visual output pixel-identical to pre-refactor
- `DrawContext` type unchanged
- No new dependencies

**Risk**: The draw modules have subtle interactions (e.g., `drawSeries.ts` pixel-alignment `translate` trick, `drawAxes.ts` rotation via `setTransform`). All must be faithfully preserved in `Canvas2DPipeline`.

### Phase 1: WebGPU Geometry Pipeline

**Goal**: Series lines, fills, and bars render via GPU. Text and cursor still Canvas 2D.

**Steps**:

1. Implement `WebGPUPipeline` skeleton (adapter/device request, canvas context config)
2. Build `lineExpand.ts` (CPU line strip → triangle strip with joins/caps)
3. Build `triangulate.ts` (monotone polygon triangulation)
4. Build `tessellate.ts` (adaptive de Casteljau for Bezier curves)
5. Write `line.wgsl`, `fill.wgsl`, `rect.wgsl` shaders
6. Build `GPUPathCache` with LRU eviction mirroring `CanvasRenderer` cache
7. Add tessellation code paths to `linear.ts`, then `stepped.ts`, `bars.ts`, splines, `points.ts`
8. Implement gradient uniform system (up to 8 stops)
9. Implement unconverted-builder fallback (render on draw-hook canvas with warning)

**Invariants**:

- Linear + bar charts render identically via WebGPU vs Canvas 2D
- Path builders still produce `SeriesPaths` with `Path2D` — no breaking type changes
- `GPUPathCache` evicts in sync with `CanvasRenderer` LRU cache
- Canvas 2D mode unaffected
- LTTB downsampling applies to both backends

**Risk**: Line rendering quality (anti-aliasing, miter join limits, dash alignment) must match Canvas 2D output. Extensive visual comparison needed.

### Phase 2: Three-Canvas Stack, Axes, and Text

**Goal**: Full chart rendering including axes, grid, labels, and title. Three-canvas DOM structure in WebGPU mode.

**Steps**:

1. Add three `<canvas>` elements to `Chart.tsx` (WebGPU mode only)
2. Wire ResizeObserver to resize all three canvases
3. Implement grid line rendering via GPU instanced lines (replaces `drawOrthoLines` loop)
4. Implement axis borders via line pipeline
5. Render tick labels, axis labels, and title on overlay canvas via `fillText`/`setTransform`/`rotate`
6. Implement dashed grid lines via distance-along-line in fragment shader
7. Add `renderer` prop to `ChartProps`
8. Implement async GPU init: Canvas 2D first, swap on device ready
9. Implement `device.lost` handler with fallback and exponential backoff retry

**Invariants**:

- Full chart with axes, grid, labels, title renders correctly in both backends
- `renderer="canvas2d"` produces identical output to pre-migration
- First frame always renders (no blank flash during GPU init)
- Device loss recovers gracefully

### Phase 3: Cursor, Selection, Snapshot, Clipping

**Goal**: Full interactivity — cursor tracking, drag-to-zoom, focus dimming, snapshot-based fast redraws.

**Steps**:

1. Implement render-to-texture snapshot (`copyTextureToTexture` + draw-hook canvas `drawImage`)
2. Write `blit.wgsl` for snapshot restore
3. Implement cursor-only fast path (restore GPU snapshot + draw-hook snapshot + fresh overlay)
4. Cursor crosshair and point indicator on overlay canvas (Canvas 2D — same as today)
5. Selection rectangle on overlay canvas (Canvas 2D)
6. Implement scissor-rect gap clipping (≤20 regions) with overlap for miter joins
7. Implement stencil-buffer gap clipping (>20 regions)
8. Write `circle.wgsl` for SDF data point rendering
9. Implement focus dimming via color uniform alpha

**Invariants**:

- Cursor-only redraws do not re-execute draw hooks
- Focus dimming matches Canvas 2D appearance
- Gap clipping handles sparse data (>20 gaps) without draw call explosion
- Drag-to-zoom selection rectangle works
- Snapshot invalidation triggers on same conditions as Canvas 2D

### Phase 4: User Hooks and Annotations

**Goal**: All user-facing draw hook features work correctly in WebGPU mode.

**Steps**:

1. Wire `getDrawHookContext()` to return draw-hook canvas (middle) context with clip + scale
2. Wire `getCursorDrawHookContext()` to return overlay canvas (top) context with scale (no clip)
3. Verify all annotation components (HLine, VLine, Region, AnnotationLabel)
4. Verify Timeline component (explicit clip + pxRatio handling)
5. Verify candlestick DrawCallback
6. Verify `useDrawHook` and `useCursorDrawHook` public API
7. Run all 99 demo examples in WebGPU mode

**Invariants**:

- `DrawContext.ctx` is always a real `CanvasRenderingContext2D`
- Persistent hooks render above series, below cursor
- Cursor hooks render on top of everything
- Z-ordering identical to Canvas 2D mode
- `dc.valToX()` / `dc.valToY()` return correct pixel positions

### Phase 5: Benchmarking and Optimization

**Goal**: Measure performance, then optimize the bottlenecks that matter.

**Step 1 — Benchmark** (before any optimization):

- Measure with 10K, 100K, 1M, 10M points on linear + bar + spline charts
- Frame time breakdown: LTTB sampling, tessellation, GPU buffer upload, draw calls, text overlay
- Memory: GPU buffer usage, JS heap delta, `GPUPathCache` size
- Compare: Canvas 2D (no LTTB) vs Canvas 2D (LTTB) vs WebGPU (LTTB)

**Step 2 — Optimize** (guided by measurements):

- **Buffer pooling** (`bufferPool.ts`): ring-buffer allocator, reuse GPU buffers across frames
- **Path cache integration**: skip tessellation + upload on `GPUPathCache` hit
- **Streaming data**: `writeBuffer` with offset for append-only updates (new data appended → upload only new vertices)
- **Draw call batching**: group series with same visual style into single instanced draw calls
- **GPU compute LTTB**: If CPU LTTB becomes the bottleneck at 10M+ points, port the LTTB algorithm to a WebGPU compute shader. This is the ChartGPU scatter density pattern: compute shader reads raw data buffer, writes sampled output buffer, render pipeline reads sampled buffer. Eliminates the CPU→GPU round-trip for large datasets.

---

## 7. Verification

| Check | Command / Method | When |
|-------|-----------------|------|
| Unit tests | `npm run test` | After every phase |
| Type safety | `npm run typecheck` | After every phase |
| Lint | `npm run lint` | After every phase |
| Visual comparison | `npm run dev` — side-by-side `renderer="canvas2d"` vs `renderer="webgpu"` | Phase 1+ |
| Fallback | Force `renderer="canvas2d"` or test in browser without WebGPU | Phase 2+ |
| Device loss | Simulate via `device.destroy()` in devtools | Phase 2+ |
| Draw hooks | Verify HLine, VLine, Region, Timeline, candlestick in both backends | Phase 4 |
| Z-ordering | Confirm hooks render between series and cursor | Phase 4 |
| All demos | Run all 99 demo examples in WebGPU mode | Phase 4 |
| Performance | Benchmark 10K/100K/1M/10M points, compare all backends | Phase 5 |
| Memory | Profile GPU buffer + JS heap under sustained use | Phase 5 |
