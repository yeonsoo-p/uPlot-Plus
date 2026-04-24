import { useState } from 'react';
import { Chart, Series, Candlestick, Band, Legend, Tooltip, ThemeProvider, DARK_THEME, bars } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

// --- Shared data ---
const lineData = [{
  x: Array.from({ length: 30 }, (_, i) => i),
  series: [
    Array.from({ length: 30 }, (_, i) => Math.sin(i * 0.2) * 20 + 60),
    Array.from({ length: 30 }, (_, i) => Math.cos(i * 0.15) * 15 + 45),
  ],
}];

const barData = [{
  x: Array.from({ length: 8 }, (_, i) => i),
  series: [
    [42, 58, 35, 72, 48, 63, 55, 40],
    [28, 45, 22, 50, 38, 42, 30, 35],
  ],
}];

const bandN = 30;
const bandX = Array.from({ length: bandN }, (_, i) => i);
const mean = bandX.map(i => Math.sin(i * 0.1) * 15 + 50);
const bandData = [{ x: bandX, series: [mean, mean.map(m => m + 5 + Math.random() * 2), mean.map(m => m - 5 - Math.random() * 2)] }];

function generateOHLC() {
  const n = 20;
  const x: number[] = [], open: number[] = [], high: number[] = [], low: number[] = [], close: number[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    x.push(i);
    const o = price, c = o + (Math.random() - 0.48) * 4;
    high.push(Math.max(o, c) + Math.random() * 2);
    low.push(Math.min(o, c) - Math.random() * 2);
    open.push(o); close.push(c);
    price = c;
  }
  return [{ x, series: [open, high, low, close] }];
}

const analyticsDark: ChartTheme = {
  ...DARK_THEME,
  seriesColors: ['#64b5f6', '#81c784'],
  cursor: { stroke: '#90caf9', pointFill: '#1a1a2e' },
  select: { fill: 'rgba(100,181,246,0.1)', stroke: 'rgba(100,181,246,0.3)' },
  bandFill: 'rgba(100,181,246,0.1)',
  overlay: { panelBg: 'rgba(26,26,46,0.95)', panelBorder: '#334', panelShadow: '0 2px 8px rgba(0,0,0,0.4)' },
};

const tradingTerminal: ChartTheme = {
  axisStroke: '#76ff03',
  gridStroke: 'rgba(118,255,3,0.06)',
  titleFill: '#76ff03',
  seriesColors: ['#76ff03', '#00e5ff'],
  cursor: { stroke: '#ffea00', pointFill: '#0a0a0a' },
  select: { fill: 'rgba(118,255,3,0.08)', stroke: 'rgba(118,255,3,0.2)' },
  candlestick: { upColor: '#76ff03', downColor: '#ff1744' },
  bandFill: 'rgba(118,255,3,0.08)',
  overlay: { panelBg: 'rgba(10,10,10,0.95)', panelBorder: '#1a3a0a', panelShadow: '0 2px 8px rgba(0,0,0,0.6)' },
};

const themes = [
  { key: 'analytics', theme: analyticsDark, bg: '#1a1a2e', label: 'Analytics Dark' },
  { key: 'trading', theme: tradingTerminal, bg: '#0a0a0a', label: 'Trading Terminal' },
];

export default function ThemedDashboard() {
  const [idx, setIdx] = useState(0);
  const fallback = themes[0] ?? { key: 'analytics', theme: analyticsDark, bg: '#1a1a2e', label: 'Analytics Dark' };
  const active = themes[idx] ?? fallback;
  const ohlc = generateOHLC();

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {themes.map((t, i) => (
          <button
            key={t.key}
            className={`px-3 py-1 rounded border text-sm ${idx === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}
            onClick={() => setIdx(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ThemeProvider theme={active.theme}>
        <div style={{ background: active.bg, padding: 12, borderRadius: 8, transition: 'background 0.3s' }}>
          <div className="grid grid-cols-2 gap-3">
            <Chart width={380} height={200} data={lineData} title="Metrics">
              <Series label="Requests" />
              <Series label="Latency" />
              <Legend />
              <Tooltip />
            </Chart>

            <Chart width={380} height={200} data={barData} title="Categories">
              <Series label="Revenue" paths={bars()} />
              <Series label="Costs" paths={bars()} />
              <Legend />
            </Chart>

            <Chart width={380} height={200} data={bandData} title="Confidence">
              <Series label="Mean" />
              <Series label="Upper" dash={[4, 4]} />
              <Series label="Lower" dash={[4, 4]} />
              <Band series={[1, 2]} group={0} />
            </Chart>

            <Chart width={380} height={200} data={ohlc} title="OHLC">
              <Candlestick />
            </Chart>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
