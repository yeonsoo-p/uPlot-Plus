# Performance Optimizations for uPlot-Plus

GPU-independent optimizations that benefit the Canvas 2D backend. These should be implemented before [WEBGPU_PLAN.md](WEBGPU_PLAN.md) because they have the largest impact and work for all users regardless of browser GPU support.

**Reference**: Techniques adapted from ChartGPU (`/home/user/workspace/ChartGPU`), which achieves 50M+ points at 60fps. Most of its speed comes from CPU-side data pipeline optimizations (LTTB, geometric buffers, change detection), not GPU rendering alone.

---

## 1. Bottleneck Analysis

Where CPU time goes on a 1M-point line chart (single series, 1000px wide):

```
┌─────────────────────────────────────────────────────────────────┐
│ Frame budget: 16.6ms (60fps)                                    │
│                                                                 │
│ ┌─ Data pipeline (CPU) ─────────────────────────────────────┐   │
│ │ Binary search (window)     O(log n)    ~0.001ms  ✓ fast   │   │
│ │ BlockMinMax range query    O(n/1024)   ~0.01ms   ✓ fast   │   │
│ │ Cursor snapping            O(log n)    ~0.001ms  ✓ fast   │   │
│ │ Scale auto-range           O(S×log n)  ~0.05ms   ✓ fast   │   │
│ │ Tick generation            O(axes×50)  ~0.1ms    ✓ fast   │   │
│ │                                                            │   │
│ │ Path building iteration    O(n)        ~3-8ms    ✗ SLOW   │   │
│ │   (visits every point even with decimation)                │   │
│ │ Path2D construction        O(n) lineTo ~2-4ms    ✗ SLOW   │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Rendering (CPU, Canvas 2D) ──────────────────────────────┐   │
│ │ ctx.stroke(Path2D)         O(pixels)   ~3-6ms    ✗ SLOW   │   │
│ │ ctx.fill(Path2D)           O(pixels)   ~2-4ms    ✗ SLOW   │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Total for 1M points: ~10-22ms (misses 60fps budget)             │
│ Total for 100K points: ~2-5ms  (fits, but tight with zoom)      │
└─────────────────────────────────────────────────────────────────┘
```

The O(n) path building iteration and Canvas 2D rasterization are the two dominant costs. This plan addresses the first; [WEBGPU_PLAN.md](WEBGPU_PLAN.md) addresses the second.

---

## 2. Optimizations

### 2.1 LTTB Downsampling (highest impact)

LTTB (Largest-Triangle-Three-Buckets) reduces n data points to k representative points while preserving visual shape — peaks, valleys, and trends. O(n) time, perceptually optimal output.

**How it works**:
1. Divide visible data range [i0, i1] into k buckets (k = target sample count)
2. For each bucket, select the point that forms the largest triangle area with the previously selected point and the average of the next bucket
3. Triangle area = cross-product magnitude: `|(ax - avgX)(by - ay) - (ax - bx)(avgY - ay)|`
4. First and last points always preserved exactly

**Integration point**: `CanvasRenderer.drawSeries()`, before calling `pathBuilder()`:

```ts
const threshold = plotBox.width * 2;  // ~2 points per pixel
if (idx1 - idx0 > threshold && config.sampling !== 'none') {
  const [sampledX, sampledY] = lttbSample(dataX, dataY, idx0, idx1, threshold);
  paths = pathBuilder(sampledX, sampledY, ..., 0, sampledX.length - 1, ...);
} else {
  paths = pathBuilder(dataX, dataY, ..., idx0, idx1, ...);
}
```

**Replaces existing decimation**: The linear path builder (`src/paths/linear.ts:91-159`) has pixel-column decimation that activates at >4× oversampling. LTTB is strictly better — it preserves visual features that pixel-column min/max can miss, and it runs before Path2D construction so it also reduces `lineTo` call count.

**Per-series configuration**: `sampling?: 'lttb' | 'none'` on `SeriesConfig`.
- Default `'lttb'` for line/area/spline series
- Default `'none'` for bars/points/candlestick (need exact positions)

**Cache interaction**: LTTB output cached alongside `SeriesPaths` in the LRU cache, keyed by `"group:index:i0:i1"`. Scale-stamp invalidation handles zoom changes.

**Expected impact**:

| Points | Without LTTB | With LTTB | Speedup |
|--------|-------------|-----------|---------|
| 100K on 1000px | ~2-5ms path build | ~0.5ms LTTB + ~0.2ms path | ~3-7× |
| 1M on 1000px | ~10-22ms (frame drop) | ~2ms LTTB + ~0.2ms path | ~5-10× |
| 10M on 1000px | ~100ms+ (unusable) | ~20ms LTTB + ~0.2ms path | ~5× |

**Reference**: ChartGPU `src/data/lttbSample.ts` — two implementations (interleaved Float32Array and DataPoint[] paths), ~170 lines total.

### 2.2 Geometric Buffer Growth for Streaming

**Problem**: `DataStore.appendData()` converts `Float64Array` → regular array on first append, then uses `array.push()` per point. Each push may trigger reallocation.

**Solution**: Power-of-2 geometric growth policy (from ChartGPU `src/data/createDataStore.ts:54-66`):

```ts
function nextPow2(v: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, Math.ceil(v))));
}
```

Pre-allocate append buffers with 2× capacity. When buffer fills, allocate new buffer at `nextPow2(current + needed)`. Copy existing data once. This reduces reallocation from O(n) individual pushes to O(log n) doublings.

**Where**: `src/core/DataStore.ts` — `appendData()` method.

**Expected impact**: High for streaming use cases (`useStreamingData` with high-frequency appends). Reduces allocation thrashing from O(n) to O(log n).

### 2.3 Per-Axis Scale Stamps

**Problem**: `CanvasRenderer.checkScaleStamp()` builds a fingerprint of ALL scales (`"id:min:max;"`). Any scale change clears the entire path cache. This means a y-scale zoom clears x-path caches that are still valid.

**Solution**: Split scale stamps into per-axis stamps. X-scale changes invalidate x-window paths. Y-scale changes only invalidate series that use that y-scale.

```ts
// Current: single stamp
stamp = `${id}:${min}:${max};` for ALL scales

// Proposed: per-group x-stamp + per-series y-stamp
xStamp[group] = `${xScaleId}:${min}:${max}`
yStamp[group:index] = `${yScaleId}:${min}:${max}`
```

**Where**: `src/rendering/CanvasRenderer.ts:92-110` — `checkScaleStamp()`.

**Expected impact**: High during y-axis interactions (drag-to-scale Y, auto-range changes). Preserves cached paths when only the y-axis changes.

### 2.4 Delta-Time Capping

**Problem**: When a user switches tabs and returns, `requestAnimationFrame` resumes with a large delta time. Animated transitions (zoom easing) jump to unexpected states.

**Solution** (from ChartGPU `src/core/RenderScheduler.ts:167-172`): Cap delta time to 100ms in the scheduler:

```ts
const dt = Math.min(timestamp - lastTimestamp, 100);
```

**Where**: `src/core/RenderScheduler.ts` — `scheduleFrame()` callback.

**Expected impact**: Low-medium. Fixes UX jank on tab-switch resume. Two-line change.

### 2.5 FNV-1a Content Hashing for Dirty Detection

**Problem**: When `data` prop reference changes but content is identical (common in React), the library clears all caches and rebuilds everything.

**Solution** (from ChartGPU `src/data/createDataStore.ts:68-84`): Hash data content via FNV-1a on ingestion. Skip cache clear if hash matches previous.

```ts
function fnv1a32(data: ArrayLike<number>, length: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < length; i++) {
    hash ^= (data[i] | 0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
```

Hash the Float64Array backing x and y data. Compare before clearing caches in `DataStore.setData()`.

**Incremental variant for streaming**: Only hash newly appended data, XOR with previous hash. Avoids re-hashing the entire dataset.

**Where**: `src/core/DataStore.ts` — `setData()` and `appendData()`.

**Expected impact**: Medium. Prevents unnecessary full redraws when React re-renders with same data.

### 2.6 Affine Transform Caching

**Problem**: Path builders call `valToPos()` per data point, which internally computes `(val - min) / (max - min) * dim + off`. The division and scaling are recomputed every call despite being constant for the frame.

**Solution** (from ChartGPU `src/renderers/createLineRenderer.ts:56-92`): Pre-compute affine coefficients once per scale per frame:

```ts
// Pre-compute once:
const ax = dim / (max - min);
const bx = off - ax * min;

// Per point (2 ops instead of 4):
const px = ax * val + bx;
```

**Where**: `src/paths/linear.ts` (and all path builders) — replace `valToPos()` calls in hot loops with pre-computed affine.

**Expected impact**: Medium. ~2× reduction in per-point arithmetic. Matters when LTTB threshold is high or disabled.

### 2.7 Monotonicity Caching

**Problem**: `DataStore.updateWindows()` calls `closestIdx()` (binary search) which assumes sorted x-data. If data is unsorted, the binary search returns wrong results silently.

**Solution** (from ChartGPU `src/core/renderCoordinator/data/computeVisibleSlice.ts:31-68`): Cache monotonicity check per data reference via `WeakMap`:

```ts
const monotonicCache = new WeakMap<ArrayLike<number>, boolean>();

function isMonotonic(x: ArrayLike<number>): boolean {
  const cached = monotonicCache.get(x);
  if (cached !== undefined) return cached;
  let result = true;
  for (let i = 1; i < x.length; i++) {
    if (x[i] < x[i - 1]) { result = false; break; }
  }
  monotonicCache.set(x, result);
  return result;
}
```

O(n) scan happens once per unique data reference. Subsequent calls are O(1). If non-monotonic, fall back to linear scan for windowing instead of binary search.

**Where**: `src/core/DataStore.ts` — before `closestIdx()` calls.

**Expected impact**: Low (correctness fix + defensive caching). Prevents silent bugs with unsorted data.

### 2.8 Batch BlockMinMaxTree Updates

**Problem**: `DataStore.appendData()` grows the BlockMinMaxTree point-by-point after converting arrays.

**Solution**: Collect all new points, call `BlockMinMax.grow()` once, then batch-update affected blocks.

**Where**: `src/core/DataStore.ts` — `appendData()`, and `src/core/BlockMinMax.ts` — `grow()`.

**Expected impact**: Medium for streaming. Reduces per-point overhead in tree maintenance.

### 2.9 Small-Range Min/Max Fast Path

**Problem**: `BlockMinMaxTree.rangeMinMax()` has overhead from block indexing for small ranges.

**Solution**: If `i1 - i0 < blockSize` (1024), skip block lookup and do direct linear scan. The linear scan has better cache locality for small ranges.

```ts
rangeMinMax(i0: number, i1: number): [number, number] {
  if (i1 - i0 < this.blockSize) {
    return this.linearScan(i0, i1);  // Direct scan, skip block overhead
  }
  // ... existing block-based algorithm
}
```

**Where**: `src/core/BlockMinMax.ts` — `rangeMinMax()`.

**Expected impact**: Low-medium. Faster auto-ranging when deeply zoomed.

---

## 3. New Files

| File | Phase | Purpose |
|------|-------|---------|
| `src/data/lttbSample.ts` | 0 | LTTB downsampling algorithm |
| `src/data/fnv1a.ts` | 0 | FNV-1a hash function for content change detection |

## 4. Modified Files

| File | Phase | Change |
|------|-------|--------|
| `src/rendering/CanvasRenderer.ts` | 0 | LTTB integration before `pathBuilder()` call; per-axis scale stamps |
| `src/paths/linear.ts` | 0 | Remove pixel-column decimation (replaced by LTTB upstream) |
| `src/types/series.ts` | 0 | Add `sampling?: 'lttb' \| 'none'` to `SeriesConfig` |
| `src/core/DataStore.ts` | 0 | Geometric buffer growth; FNV-1a dirty detection; monotonicity caching; batch tree updates |
| `src/core/BlockMinMax.ts` | 1 | Small-range fast path |
| `src/core/RenderScheduler.ts` | 1 | Delta-time capping |
| `src/paths/linear.ts` | 1 | Affine transform caching in hot loop |
| `src/paths/stepped.ts` | 1 | Same |
| `src/paths/spline.ts` | 1 | Same |

---

## 5. Phases

### Phase 0: Data Pipeline (highest impact)

**Goal**: Reduce path building from O(n) to O(pixels). Fix streaming performance.

**Steps**:

1. Implement LTTB algorithm in `src/data/lttbSample.ts`
   - Input: `dataX`, `dataY`, `idx0`, `idx1`, `threshold`
   - Output: sampled arrays with `threshold` representative points
   - Reference: ChartGPU `src/data/lttbSample.ts`
2. Integrate LTTB into `CanvasRenderer.drawSeries()` before `pathBuilder()` call
3. Add `sampling?: 'lttb' | 'none'` to `SeriesConfig` (default `'lttb'` for line/area/spline)
4. Remove pixel-column decimation in `linear.ts` (replaced by LTTB)
5. Implement geometric buffer growth in `DataStore.appendData()`
6. Implement FNV-1a content hashing in `DataStore.setData()` and `appendData()`
7. Implement per-axis scale stamps in `CanvasRenderer.checkScaleStamp()`
8. Add monotonicity caching in `DataStore` (WeakMap per x-array)
9. Benchmark: 100K, 1M, 10M points with and without LTTB

**Invariants**:

- Visual output with LTTB closely matches without (no visible artifacts at normal zoom)
- At full zoom (few points visible), LTTB is bypassed — exact rendering preserved
- `sampling: 'none'` produces identical output to pre-LTTB
- Streaming performance (appendData) does not regress
- All existing tests pass

### Phase 1: Micro-Optimizations

**Goal**: Squeeze remaining performance from hot loops and scheduling.

**Steps**:

1. Pre-compute affine transform coefficients in path builder hot loops
2. Add small-range fast path to `BlockMinMax.rangeMinMax()`
3. Add delta-time capping to `RenderScheduler`
4. Batch `BlockMinMaxTree` updates in `appendData()`

**Invariants**:

- All existing tests pass
- Visual output identical
- Tab-switch resume does not cause animation jumps

---

## 6. Verification

| Check | Command / Method | When |
|-------|-----------------|------|
| Unit tests | `npm run test` | After every change |
| Type safety | `npm run typecheck` | After every change |
| Lint | `npm run lint` | After every change |
| LTTB visual quality | Compare LTTB vs exact rendering at various zoom levels in demo | Phase 0 |
| LTTB benchmarks | 100K/1M/10M points frame time with and without LTTB | Phase 0 |
| Streaming benchmark | `useStreamingData` with 1K appends/sec, measure allocation rate | Phase 0 |
| Cache hit rate | Log cache hits/misses during y-axis drag interaction | Phase 0 |
| Affine transform | Benchmark path building with/without affine caching (10M points) | Phase 1 |
| Delta-time | Switch tabs during zoom animation, verify smooth resume | Phase 1 |
