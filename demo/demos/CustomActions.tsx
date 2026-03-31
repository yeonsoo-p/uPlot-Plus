import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';
import type { ActionEntry } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50);
  const y2 = x.map(i => Math.cos(i * 0.03) * 30 + 45);
  return [{ x, series: [y1, y2] }];
}

export default function CustomActions() {
  const data = useMemo(() => generateData(), []);
  const [thickSeries, setThickSeries] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<string[]>([]);

  // Track Q key state via ref — synchronous, no render cycle delay
  const qHeld = useRef(false);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8));
  }, []);

  const actions = useMemo<ActionEntry[]>(() => [
    // String → function: shift+click toggles stroke width
    ['shiftLeftClick', (store) => {
      const cursor = store.cursorManager.state;
      if (cursor.activeSeriesIdx >= 0) {
        const key = `${cursor.activeGroup}:${cursor.activeSeriesIdx}`;
        const cfg = store.seriesConfigMap.get(key);
        if (cfg != null) {
          const isThick = (cfg.width ?? 2) > 2;
          cfg.width = isThick ? 2 : 5;
          setThickSeries(prev => {
            const next = new Set(prev);
            if (isThick) next.delete(cursor.activeSeriesIdx);
            else next.add(cursor.activeSeriesIdx);
            return next;
          });
          addLog(`Shift+click: series ${cursor.activeSeriesIdx} → ${isThick ? 'thin' : 'thick'}`);
          store.renderer.clearCache();
          store.scheduleRedraw();
        }
      }
    }],
    // String → function: ctrl+click logs data point
    ['ctrlLeftClick', (store) => {
      const cursor = store.cursorManager.state;
      if (cursor.activeGroup >= 0 && cursor.activeDataIdx >= 0) {
        const group = store.dataStore.data[cursor.activeGroup];
        if (group != null) {
          const xVal = group.x[cursor.activeDataIdx];
          const yData = group.series[cursor.activeSeriesIdx];
          const yVal = yData != null ? yData[cursor.activeDataIdx] : null;
          addLog(`Ctrl+click: series ${cursor.activeSeriesIdx}, x=${xVal?.toFixed(1)}, y=${yVal?.toFixed(1)}`);
        }
      }
    }],
    // String → function: Shift+X keyboard shortcut resets widths
    ['shiftKeyX', () => {
      setThickSeries(new Set());
      addLog('Shift+X: reset all series widths');
    }],
    // String → string: middle-drag pans
    ['middleDrag', 'panXY'],
    // Track Q key state for chord detection (ref — no render delay)
    ['keyQ', () => { qHeld.current = true; }],
    // True custom: function → function (Q held + left click = highlight nearest point)
    [(e, ctx) => qHeld.current && e instanceof MouseEvent && ctx.action === 'leftClick',
      (store) => {
        const cursor = store.cursorManager.state;
        if (cursor.activeDataIdx >= 0) {
          addLog(`Q+click: nearest point idx=${cursor.activeDataIdx}`);
        }
      },
    ],
  ], [addLog]);

  return (
    <div
      onKeyUp={(e) => { if (e.key === 'q' || e.key === 'Q') qHeld.current = false; }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>
        <b>Shift+click</b> toggles stroke width.{' '}
        <b>Ctrl+click</b> logs data point.{' '}
        <b>Shift+X</b> resets widths.{' '}
        <b>Hold Q + click</b> logs nearest point (custom function matcher).{' '}
        <b>Middle-drag</b> pans.
      </p>
      <Chart width={800} height={400} data={data} actions={actions} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} label="Signal A" width={thickSeries.has(0) ? 5 : 2} />
        <Series group={0} index={1} label="Signal B" width={thickSeries.has(1) ? 5 : 2} />
        <Legend />
      </Chart>
      {log.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>
          {log.map((msg, i) => <div key={i} style={{ opacity: 1 - i * 0.1 }}>{msg}</div>)}
        </div>
      )}
    </div>
  );
}
