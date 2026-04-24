import { Chart, Series, Legend, ThemeProvider } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

const data = [{
  x: Array.from({ length: 40 }, (_, i) => i),
  series: [
    Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.15) * 30 + 50),
    Array.from({ length: 40 }, (_, i) => Math.cos(i * 0.12) * 25 + 50),
  ],
}];

const ocean: ChartTheme = {
  axisStroke: '#8ab4f8',
  gridStroke: 'rgba(138,180,248,0.1)',
  seriesColors: ['#64ffda', '#80cbc4'],
  cursor: { stroke: '#64ffda', pointFill: '#0d1b2a' },
};

const oceanCssVars: Record<string, string> = {
  '--uplot-axis-stroke': '#8ab4f8',
  '--uplot-grid-stroke': 'rgba(138,180,248,0.1)',
  '--uplot-series-colors': '#64ffda,#80cbc4',
  '--uplot-cursor-stroke': '#64ffda',
  '--uplot-point-fill': '#0d1b2a',
};

const bg = { background: '#0d1b2a', padding: 8, borderRadius: 6 };

export default function ApplyingThemes() {
  return (
    <div>
      <div className="flex gap-4 flex-wrap">
        <div>
          <h4 className="mb-1 text-sm">ThemeProvider</h4>
          <p className="text-xs text-gray-500 mb-2">Wraps descendants via React context</p>
          <ThemeProvider theme={ocean}>
            <div style={bg}>
              <Chart width={240} height={240} data={data}>
                <Series label="A" />
                <Series label="B" />
                <Legend />
              </Chart>
            </div>
          </ThemeProvider>
        </div>

        <div>
          <h4 className="mb-1 text-sm">Chart theme prop</h4>
          <p className="text-xs text-gray-500 mb-2">Per-chart, no provider needed</p>
          <div style={bg}>
            <Chart width={240} height={240} data={data} theme={ocean}>
              <Series label="A" />
              <Series label="B" />
              <Legend />
            </Chart>
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-sm">CSS Custom Properties</h4>
          <p className="text-xs text-gray-500 mb-2">Pure CSS, no React API needed</p>
          <div style={{ ...bg, ...oceanCssVars }}>
            <Chart width={240} height={240} data={data}>
              <Series label="A" />
              <Series label="B" />
              <Legend />
            </Chart>
          </div>
        </div>
      </div>
    </div>
  );
}
