import { useEffect } from 'react';
import { Chart, Series, Legend, Tooltip } from 'uplot-plus';

const data = [{
  x: Array.from({ length: 50 }, (_, i) => i),
  series: [
    Array.from({ length: 50 }, (_, i) => Math.sin(i * 0.12) * 30 + 50),
    Array.from({ length: 50 }, (_, i) => Math.cos(i * 0.1) * 25 + 50),
  ],
}];

const cssText = `
.uplot-auto-scheme {
  --uplot-axis-stroke: #555;
  --uplot-grid-stroke: rgba(0, 0, 0, 0.07);
  --uplot-title-fill: #222;
  --uplot-series-colors: #2563eb, #059669;
  --uplot-cursor-stroke: #2563eb;
  --uplot-point-fill: #fff;
  --uplot-select-fill: rgba(37, 99, 235, 0.08);
  --uplot-select-stroke: rgba(37, 99, 235, 0.3);
  background: #fff;
  color: #222;
  padding: 10px;
  border-radius: 6px;
  transition: background 0.3s, color 0.3s;
}

@media (prefers-color-scheme: dark) {
  .uplot-auto-scheme {
    --uplot-axis-stroke: #bbb;
    --uplot-grid-stroke: rgba(255, 255, 255, 0.07);
    --uplot-title-fill: #ddd;
    --uplot-series-colors: #60a5fa, #34d399;
    --uplot-cursor-stroke: #60a5fa;
    --uplot-point-fill: #1e1e1e;
    --uplot-select-fill: rgba(96, 165, 250, 0.08);
    --uplot-select-stroke: rgba(96, 165, 250, 0.3);
    background: #1e1e1e;
    color: #ddd;
  }
}`;

export default function SystemColorScheme() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        This chart follows your OS light/dark setting automatically via
        <code className="mx-1 text-xs bg-gray-100 px-1 py-0.5 rounded">prefers-color-scheme</code>
        — zero JavaScript theme logic.
      </p>

      <div className="uplot-auto-scheme">
        <Chart width="auto" height={340} data={data} title="Auto Light/Dark">
          <Series label="Revenue" />
          <Series label="Growth" />
          <Legend />
          <Tooltip />
        </Chart>
      </div>

      <div className="mt-4">
        <h4 className="text-sm mb-1">CSS</h4>
        <pre className="text-xs bg-gray-100 text-gray-800 p-3 rounded overflow-auto max-h-52">{cssText.trim()}</pre>
      </div>
    </div>
  );
}
