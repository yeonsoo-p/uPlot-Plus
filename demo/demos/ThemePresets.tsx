import { useState } from 'react';
import { Chart, Series, Scale, Axis, Legend, Tooltip, ThemeProvider, DARK_THEME, palette } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

const data = [{
  x: Array.from({ length: 60 }, (_, i) => i),
  series: [
    Array.from({ length: 60 }, (_, i) => Math.sin(i * 0.1) * 35 + 50),
    Array.from({ length: 60 }, (_, i) => Math.cos(i * 0.08) * 28 + 50),
    Array.from({ length: 60 }, (_, i) => Math.sin(i * 0.06 + 1.5) * 20 + 45),
  ],
}];

const presets: Record<string, { theme: ChartTheme; bg: string; label: string }> = {
  default: { theme: {}, bg: '#ffffff', label: 'Default' },
  dark: { theme: DARK_THEME, bg: '#1e1e1e', label: 'Dark' },
  solarized: {
    theme: {
      axisStroke: '#657b83',
      gridStroke: 'rgba(101,123,131,0.15)',
      titleFill: '#586e75',
      seriesColors: ['#dc322f', '#268bd2', '#859900'],
      cursor: { stroke: '#b58900', pointFill: '#fdf6e3' },
      select: { fill: 'rgba(181,137,0,0.1)', stroke: '#b58900' },
      overlay: { panelBg: 'rgba(253,246,227,0.95)', panelBorder: '#eee8d5' },
    },
    bg: '#fdf6e3',
    label: 'Solarized Light',
  },
  ocean: {
    theme: {
      axisStroke: '#8ab4f8',
      gridStroke: 'rgba(138,180,248,0.1)',
      titleFill: '#c4d7f5',
      seriesColors: ['#64ffda', '#80cbc4', '#4dd0e1'],
      cursor: { stroke: '#64ffda', pointFill: '#0d1b2a' },
      select: { fill: 'rgba(100,255,218,0.08)', stroke: 'rgba(100,255,218,0.3)' },
      overlay: { panelBg: 'rgba(13,27,42,0.95)', panelBorder: '#1b3a5c' },
    },
    bg: '#0d1b2a',
    label: 'Ocean',
  },
  pastel: {
    theme: {
      axisStroke: '#999',
      gridStroke: 'rgba(0,0,0,0.05)',
      seriesColors: palette(3, 55, 72),
      cursor: { stroke: '#aaa' },
      overlay: { panelBg: 'rgba(255,255,255,0.95)', panelBorder: '#ddd' },
    },
    bg: '#fafafa',
    label: 'Pastel',
  },
  highContrast: {
    theme: {
      axisStroke: '#fff',
      gridStroke: 'rgba(255,255,255,0.2)',
      titleFill: '#fff',
      seriesColors: ['#ff0', '#0ff', '#f0f'],
      cursor: { stroke: '#fff', width: 2 },
      select: { fill: 'rgba(255,255,255,0.12)', stroke: '#fff' },
      overlay: { panelBg: 'rgba(0,0,0,0.95)', panelBorder: '#666' },
    },
    bg: '#000',
    label: 'High Contrast',
  },
};

const fallback = { theme: {}, bg: '#ffffff', label: 'Default' };
const presetKeys = Object.keys(presets);

export default function ThemePresets() {
  const [active, setActive] = useState('default');
  const preset = presets[active] ?? fallback;

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {presetKeys.map(k => {
          const p = presets[k];
          return p != null ? (
            <button
              key={k}
              className={`px-3 py-1 rounded border text-sm ${active === k ? 'bg-blue-600 text-white border-blue-600' : ''}`}
              onClick={() => setActive(k)}
            >
              {p.label}
            </button>
          ) : null;
        })}
      </div>

      <ThemeProvider theme={preset.theme}>
        <div style={{ background: preset.bg, padding: 10, borderRadius: 6, transition: 'background 0.3s' }}>
          <Chart width="auto" height={360} data={data} title="Theme Presets">
            <Scale id="x" />
            <Scale id="y" />
            <Axis scale="x" />
            <Axis scale="y" />
            <Series group={0} index={0} label="Alpha" />
            <Series group={0} index={1} label="Beta" />
            <Series group={0} index={2} label="Gamma" />
            <Legend />
            <Tooltip />
          </Chart>
        </div>
      </ThemeProvider>
    </div>
  );
}
