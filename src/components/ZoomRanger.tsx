import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { DataInput } from '../types';
import { Chart } from './Chart';
import { Scale } from './Scale';
import { Series } from './Series';
import { clamp } from '../math/utils';
import { Axis } from './Axis';
import { normalizeData } from '../core/normalizeData';

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
        const xMin = group.x[0] as number;
        const xMax = group.x[group.x.length - 1] as number;
        const range = xMax - xMin;
        if (range > 0) {
          return [
            Math.max(0, (initialRange[0] - xMin) / range),
            Math.min(1, (initialRange[1] - xMin) / range),
          ];
        }
      }
    }
    return [0.25, 0.75];
  });

  // Fire onRangeChange when selection changes
  const prevRangeRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (onRangeChange == null || normalized.length === 0) return;
    const group = normalized[0];
    if (group == null || group.x.length < 2) return;

    const xMin = group.x[0] as number;
    const xMax = group.x[group.x.length - 1] as number;
    const range = xMax - xMin;
    const min = xMin + selFrac[0] * range;
    const max = xMin + selFrac[1] * range;

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
    const edgeThreshold = rectWidth > 0 ? 8 / rectWidth : 0;

    let mode: 'move' | 'left' | 'right';
    if (Math.abs(frac - selFrac[0]) < edgeThreshold) {
      mode = 'left';
    } else if (Math.abs(frac - selFrac[1]) < edgeThreshold) {
      mode = 'right';
    } else if (frac >= selFrac[0] && frac <= selFrac[1]) {
      mode = 'move';
    } else {
      // Click outside selection — center selection on click
      const selWidth = selFrac[1] - selFrac[0];
      const half = selWidth / 2;
      const newLeft = clamp(frac - half, 0, 1 - selWidth);
      setSelFrac([newLeft, newLeft + selWidth]);
      mode = 'move';
    }

    dragRef.current = {
      mode,
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

    if (drag.mode === 'move') {
      const selWidth = drag.startFrac[1] - drag.startFrac[0];
      const newLeft = clamp(drag.startFrac[0] + delta, 0, 1 - selWidth);
      setSelFrac([newLeft, newLeft + selWidth]);
    } else if (drag.mode === 'left') {
      const newLeft = clamp(drag.startFrac[0] + delta, 0, drag.startFrac[1] - 0.01);
      setSelFrac([newLeft, drag.startFrac[1]]);
    } else {
      const newRight = clamp(drag.startFrac[1] + delta, drag.startFrac[0] + 0.01, 1);
      setSelFrac([drag.startFrac[0], newRight]);
    }
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
    <div className={className} style={{ position: 'relative', width, height }}>
      <Chart width={width} height={height} data={data}>
        <Scale id="x" />
        <Scale id="y" />
        <Axis scale="x" show={false} />
        <Axis scale="y" show={false} />
        {Array.from({ length: seriesCount }, (_, i) => (
          <Series
            key={i}
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: leftPct,
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        />
        {/* Dimmed right region */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${selFrac[1] * 100}%`,
            right: 0,
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        />
        {/* Selection window */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: leftPct,
            width: widthPct,
            height: '100%',
            borderLeft: '2px solid rgba(0,100,255,0.8)',
            borderRight: '2px solid rgba(0,100,255,0.8)',
            boxSizing: 'border-box',
            cursor: 'grab',
            pointerEvents: 'none',
          }}
        >
          {grips && (
            <>
              <div style={{
                position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 24, borderRadius: 3, background: 'rgba(0,100,255,0.8)',
                cursor: 'ew-resize', pointerEvents: 'auto',
              }} />
              <div style={{
                position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 24, borderRadius: 3, background: 'rgba(0,100,255,0.8)',
                cursor: 'ew-resize', pointerEvents: 'auto',
              }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
