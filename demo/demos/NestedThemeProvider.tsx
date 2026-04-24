import { Chart, Series, Legend, ThemeProvider, DARK_THEME } from 'uplot-plus';
import type { ChartTheme } from 'uplot-plus';

const data = [{
  x: Array.from({ length: 40 }, (_, i) => i),
  series: [
    Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.15) * 30 + 50),
    Array.from({ length: 40 }, (_, i) => Math.cos(i * 0.12) * 25 + 50),
  ],
}];

const redAccent: ChartTheme = {
  seriesColors: ['#e74c3c', '#c0392b'],
  cursor: { stroke: '#e74c3c' },
  annotation: { stroke: '#e74c3c', fill: 'rgba(231,76,60,0.15)' },
};

const blueAccent: ChartTheme = {
  seriesColors: ['#3498db', '#2980b9'],
  cursor: { stroke: '#3498db' },
  annotation: { stroke: '#3498db', fill: 'rgba(52,152,219,0.15)' },
};

export default function NestedThemeProvider() {
  return (
    <div>
      <ThemeProvider theme={DARK_THEME}>
        <div style={{ background: '#1e1e1e', color: '#ccc', padding: 12, borderRadius: 6 }} className="flex gap-4 flex-wrap">
          <div>
            <h4 style={{ color: '#ccc' }} className="mb-1">Base Only <span className="text-xs font-normal opacity-60">— inherits outer DARK_THEME</span></h4>
            <Chart width={240} height={240} data={data}>
              <Series label="Primary" />
              <Series label="Secondary" />
              <Legend />
            </Chart>
          </div>

          <ThemeProvider theme={redAccent}>
            <div>
              <h4 style={{ color: '#ccc' }} className="mb-1">Red Accent <span className="text-xs font-normal opacity-60">— overrides seriesColors, cursor</span></h4>
              <Chart width={240} height={240} data={data}>
                <Series label="Primary" />
                <Series label="Secondary" />
                <Legend />
              </Chart>
            </div>
          </ThemeProvider>

          <ThemeProvider theme={blueAccent}>
            <div>
              <h4 style={{ color: '#ccc' }} className="mb-1">Blue Accent <span className="text-xs font-normal opacity-60">— overrides seriesColors, cursor</span></h4>
              <Chart width={240} height={240} data={data}>
                <Series label="Primary" />
                <Series label="Secondary" />
                <Legend />
              </Chart>
            </div>
          </ThemeProvider>
        </div>
      </ThemeProvider>
    </div>
  );
}
