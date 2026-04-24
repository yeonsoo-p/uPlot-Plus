import { Chart, Series, Candlestick, Band, Tooltip, HLine, Region, ThemeProvider, ZoomRanger } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

// --- Candlestick data ---
function generateOHLC() {
  const n = 30;
  const x: number[] = [];
  const open: number[] = [];
  const high: number[] = [];
  const low: number[] = [];
  const close: number[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    x.push(i);
    const o = price;
    const change = (Math.random() - 0.48) * 4;
    const c = o + change;
    high.push(Math.max(o, c) + Math.random() * 3);
    low.push(Math.min(o, c) - Math.random() * 3);
    open.push(o);
    close.push(c);
    price = c;
  }
  return [{ x, series: [open, high, low, close] }];
}

// --- Band + annotation data ---
const bandN = 50;
const bandX = Array.from({ length: bandN }, (_, i) => i);
const bandMean = bandX.map(i => Math.sin(i * 0.08) * 25 + 50);
const bandUpper = bandMean.map((m, i) => m + 6 + Math.sin(i * 0.2) * 2);
const bandLower = bandMean.map((m, i) => m - 6 - Math.sin(i * 0.2) * 2);
const bandData = [{ x: bandX, series: [bandMean, bandUpper, bandLower] }];

// --- Cursor/overlay data ---
const cursorData = [{
  x: Array.from({ length: 40 }, (_, i) => i),
  series: [
    Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.12) * 30 + 50),
    Array.from({ length: 40 }, (_, i) => Math.cos(i * 0.1) * 20 + 45),
  ],
}];

// --- Ranger data ---
const rangerData = [{
  x: Array.from({ length: 80 }, (_, i) => i),
  series: [Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.06) * 35 + 50)],
}];

const candlestickTheme: ChartTheme = {
  axisStroke: '#aaa',
  gridStroke: 'rgba(255,255,255,0.06)',
  candlestick: { upColor: '#39ff14', downColor: '#ff1744' },
  cursor: { stroke: '#ffd740' },
};

const bandTheme: ChartTheme = {
  axisStroke: '#455a64',
  gridStroke: 'rgba(0,0,0,0.06)',
  seriesColors: ['#1565c0', '#7986cb', '#90caf9'],
  bandFill: 'rgba(21,101,192,0.15)',
  annotation: { stroke: '#d32f2f', fill: 'rgba(211,47,47,0.08)', labelFill: '#c62828', font: 'bold 11px sans-serif' },
};

const cursorTheme: ChartTheme = {
  axisStroke: '#ccc',
  gridStroke: 'rgba(255,255,255,0.08)',
  seriesColors: ['#bb86fc', '#03dac6'],
  cursor: { stroke: '#ff0', width: 2, pointRadius: 5, pointFill: '#121212' },
  select: { fill: 'rgba(187,134,252,0.15)', stroke: '#bb86fc', width: 2 },
  overlay: { panelBg: 'rgba(30,30,30,0.95)', panelBorder: '#bb86fc', panelShadow: '0 2px 8px rgba(0,0,0,0.5)' },
};

const rangerTheme: ChartTheme = {
  axisStroke: '#78909c',
  gridStroke: 'rgba(0,0,0,0.05)',
  seriesColors: ['#ff7043'],
  ranger: { accent: 'rgba(255,112,67,0.8)', dim: 'rgba(0,0,0,0.15)' },
};

const label = (keys: string) => (
  <p className="text-xs text-gray-400 mb-2 font-mono">{keys}</p>
);

export default function ComponentThemes() {
  const ohlc = generateOHLC();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h4 className="mb-0.5 text-sm">Candlestick</h4>
        {label('candlestick.upColor  candlestick.downColor')}
        <ThemeProvider theme={candlestickTheme}>
          <div style={{ background: '#1a1a2e', padding: 8, borderRadius: 6 }}>
            <Chart width={780} height={200} data={ohlc}>
              <Candlestick />
            </Chart>
          </div>
        </ThemeProvider>
      </div>

      <div>
        <h4 className="mb-0.5 text-sm">Band + Annotations</h4>
        {label('bandFill  annotation.stroke  annotation.fill  annotation.labelFill  annotation.font')}
        <ThemeProvider theme={bandTheme}>
          <Chart width={780} height={200} data={bandData}>
            <Series label="Mean" />
            <Series label="Upper" dash={[4, 4]} />
            <Series label="Lower" dash={[4, 4]} />
            <Band series={[1, 2]} group={0} />
            <HLine value={50} />
            <Region yMin={40} yMax={60} />
          </Chart>
        </ThemeProvider>
      </div>

      <div>
        <h4 className="mb-0.5 text-sm">Cursor + Selection + Overlay</h4>
        {label('cursor.*  select.*  overlay.panelBg  overlay.panelBorder  overlay.panelShadow')}
        <ThemeProvider theme={cursorTheme}>
          <div style={{ background: '#121212', padding: 8, borderRadius: 6 }}>
            <Chart width={780} height={200} data={cursorData}>
              <Series label="Signal" />
              <Series label="Baseline" />
              <Tooltip />
            </Chart>
          </div>
        </ThemeProvider>
      </div>

      <div>
        <h4 className="mb-0.5 text-sm">Zoom Ranger</h4>
        {label('ranger.accent  ranger.dim')}
        <ThemeProvider theme={rangerTheme}>
          <Chart width={780} height={200} data={rangerData}>
            <Series label="Metric" />
            <ZoomRanger width={780} height={60} data={rangerData} />
          </Chart>
        </ThemeProvider>
      </div>
    </div>
  );
}
