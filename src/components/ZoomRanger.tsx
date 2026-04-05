import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { DataInput } from '../types';
import { Chart } from './Chart';
import { Series } from './Series';
import { clamp } from '../math/utils';
import { Axis } from './Axis';
import { normalizeData } from '../core/normalizeData';
import {
  CSS_RANGER_ACCENT, DEFAULT_RANGER_ACCENT,
  CSS_RANGER_DIM, DEFAULT_RANGER_DIM,
} from './overlay/tokens';

/** Grip hit-target width in CSS pixels */
export const GRIP_THRESHOLD_PX = 8;

/** Minimum selection width as a fraction of the full range */
export const MIN_SELECTION_FRAC = 0.01;

/** Default initial selection range when no initialRange prop is provided */
export const DEFAULT_SELECTION: [number, number] = [0.25, 0.75];

/**
 * Convert an absolute data range [min, max] to selection fractions [0..1].
 * Returns DEFAULT_SELECTION when the data range is empty or invalid.
 */
export function rangeToFrac(
  initialRange: [number, number] | undefined,
  xMin: number,
  xMax: number,
): [number, number] {
  if (initialRange == null) return DEFAULT_SELECTION;
  const range = xMax - xMin;
  if (range <= 0) return DEFAULT_SELECTION;
  return [
    Math.max(0, (initialRange[0] - xMin) / range),
    Math.min(1, (initialRange[1] - xMin) / range),
  ];
}

/**
 * Convert selection fractions back to absolute data values.
 */
export function fracToRange(
  selFrac: [number, number],
  xMin: number,
  xMax: number,
): [number, number] {
  const range = xMax - xMin;
  return [xMin + selFrac[0] * range, xMin + selFrac[1] * range];
}

/**
 * Determine drag mode based on click position relative to selection edges.
 */
export function detectDragMode(
  frac: number,
  selFrac: [number, number],
  edgeThreshold: number,
): 'left' | 'right' | 'move' | 'outside' {
  if (Math.abs(frac - selFrac[0]) < edgeThreshold) return 'left';
  if (Math.abs(frac - selFrac[1]) < edgeThreshold) return 'right';
  if (frac >= selFrac[0] && frac <= selFrac[1]) return 'move';
  return 'outside';
}

/**
 * Compute new selection fractions after a drag delta.
 */
export function applyDrag(
  mode: 'move' | 'left' | 'right',
  startFrac: [number, number],
  delta: number,
): [number, number] {
  if (mode === 'move') {
    const selWidth = startFrac[1] - startFrac[0];
    const newLeft = clamp(startFrac[0] + delta, 0, 1 - selWidth);
    return [newLeft, newLeft + selWidth];
  }
  if (mode === 'left') {
    const newLeft = clamp(startFrac[0] + delta, 0, startFrac[1] - MIN_SELECTION_FRAC);
    return [newLeft, startFrac[1]];
  }
  // right
  const newRight = clamp(startFrac[1] + delta, startFrac[0] + MIN_SELECTION_FRAC, 1);
  return [startFrac[0], newRight];
}

export interface ZoomRangerProps {
  /** Chart width in CSS pixels */
  width: number;
  /** Chart height in CSS pixels */
  height: number;
  /** Data to render in the overview — accepts {x,y}, [{x,y}], or [{x, series:[...]}] */
  data: DataInput;
  /** Called when the selection range changes */
  onRangeChange?: (min: number, max: number) => void;
  /** Initial selection range as [min, max] data values */
  initialRange?: [number, number];
  /** CSS class for the outer wrapper */
  className?: string;
  /** Series colors (one per series in group 0) */
  colors?: string[];
  /** Show grip handles on edges */
  grips?: boolean;
}

/**
 * ZoomRanger — an overview mini-chart with a draggable selection window.
 * The selection controls the zoom range of a linked detail chart via onRangeChange.
 */
export function ZoomRanger({
  width,
  height,
  data,
  onRangeChange,
  initialRange,
  className,
  colors,
  grips = false,
}: ZoomRangerProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize flexible input → internal ChartData
  const normalized = useMemo(() => normalizeData(data), [data]);

  // Selection as fractions [0..1] of the chart width
  const [selFrac, setSelFrac] = useState<[number, number]>(() => {
    if (initialRange != null && normalized.length > 0) {
      const group = normalized[0];
      if (group != null && group.x.length > 1) {
        return rangeToFrac(initialRange, group.x[0] as number, group.x[group.x.length - 1] as number);
      }
    }
    return DEFAULT_SELECTION;
  });

  // Fire onRangeChange when selection changes
  const prevRangeRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (onRangeChange == null || normalized.length === 0) return;
    const group = normalized[0];
    if (group == null || group.x.length < 2) return;

    const xMin = group.x[0] as number;
    const xMax = group.x[group.x.length - 1] as number;
    const [min, max] = fracToRange(selFrac, xMin, xMax);

    const prev = prevRangeRef.current;
    const eps = Math.max(1e-10, Math.abs(max - min) * 1e-12);
    if (prev != null && Math.abs(prev[0] - min) < eps && Math.abs(prev[1] - max) < eps) return;
    prevRangeRef.current = [min, max];
    onRangeChange(min, max);
  }, [selFrac, normalized, onRangeChange]);

  // Drag state
  const dragRef = useRef<{
    mode: 'move' | 'left' | 'right';
    startX: number;
    startFrac: [number, number];
  } | null>(null);

  const getFrac = useCallback((clientX: number): number => {
    const el = containerRef.current;
    if (el == null) return 0;
    const rect = el.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current;
    if (el == null) return;

    const frac = getFrac(e.clientX);
    const rectWidth = el.getBoundingClientRect().width;
    const edgeThreshold = rectWidth > 0 ? GRIP_THRESHOLD_PX / rectWidth : 0;

    const detected = detectDragMode(frac, selFrac, edgeThreshold);

    if (detected === 'outside') {
      // Click outside selection — center selection on click
      const selWidth = selFrac[1] - selFrac[0];
      const half = selWidth / 2;
      const newLeft = clamp(frac - half, 0, 1 - selWidth);
      const newSelFrac: [number, number] = [newLeft, newLeft + selWidth];
      setSelFrac(newSelFrac);
      dragRef.current = { mode: 'move', startX: e.clientX, startFrac: newSelFrac };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    dragRef.current = {
      mode: detected,
      startX: e.clientX,
      startFrac: [...selFrac],
    };

    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [selFrac, getFrac]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag == null) return;

    const frac = getFrac(e.clientX);
    const startFrac = getFrac(drag.startX);
    const delta = frac - startFrac;

    setSelFrac(applyDrag(drag.mode, drag.startFrac, delta));
  }, [getFrac]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    const el = containerRef.current;
    if (el != null) el.releasePointerCapture(e.pointerId);
  }, []);

  const leftPct = `${selFrac[0] * 100}%`;
  const widthPct = `${(selFrac[1] - selFrac[0]) * 100}%`;

  const group = normalized[0];
  const seriesCount = group != null ? group.series.length : 0;

  return (
    <div className={className} data-testid="zoom-ranger" style={{ position: 'relative', width, height }}>
      <Chart width={width} height={height} data={normalized}>
        <Axis scale="x" show={false} />
        <Axis scale="y" show={false} />
        {Array.from({ length: seriesCount }, (_, i) => (
          <Series
            key={`0:${i}`}
            group={0}
            index={i}
            yScale="y"
            stroke={colors != null && colors[i] != null ? colors[i] : `hsl(${i * 137}, 60%, 50%)`}
            width={1}
          />
        ))}
      </Chart>

      {/* Interaction overlay */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'default',
          touchAction: 'none',
        }}
      >
        {/* Dimmed left region */}
        <div
          data-testid="zoom-ranger-dim-left"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: leftPct,
            height: '100%',
            background: `var(${CSS_RANGER_DIM}, ${DEFAULT_RANGER_DIM})`,
            pointerEvents: 'none',
          }}
        />
        {/* Dimmed right region */}
        <div
          data-testid="zoom-ranger-dim-right"
          style={{
            position: 'absolute',
            top: 0,
            left: `${selFrac[1] * 100}%`,
            right: 0,
            height: '100%',
            background: `var(${CSS_RANGER_DIM}, ${DEFAULT_RANGER_DIM})`,
            pointerEvents: 'none',
          }}
        />
        {/* Selection window */}
        <div
          data-testid="zoom-ranger-selection"
          style={{
            position: 'absolute',
            top: 0,
            left: leftPct,
            width: widthPct,
            height: '100%',
            borderLeft: `2px solid var(${CSS_RANGER_ACCENT}, ${DEFAULT_RANGER_ACCENT})`,
            borderRight: `2px solid var(${CSS_RANGER_ACCENT}, ${DEFAULT_RANGER_ACCENT})`,
            boxSizing: 'border-box',
            cursor: 'grab',
            pointerEvents: 'none',
          }}
        >
          {grips && (
            <>
              <div data-testid="zoom-ranger-grip-left" style={{
                position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 24, borderRadius: 3, background: `var(${CSS_RANGER_ACCENT}, ${DEFAULT_RANGER_ACCENT})`,
                cursor: 'ew-resize', pointerEvents: 'auto',
              }} />
              <div data-testid="zoom-ranger-grip-right" style={{
                position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 24, borderRadius: 3, background: `var(${CSS_RANGER_ACCENT}, ${DEFAULT_RANGER_ACCENT})`,
                cursor: 'ew-resize', pointerEvents: 'auto',
              }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
