import React from 'react';
import { Chart, Series, Tooltip, Legend, palette } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x: number[] = [];
  const revenue: number[] = [];
  const cost: number[] = [];
  const profit: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    const r = 80 + Math.sin(i * 0.08) * 30 + (Math.random() - 0.5) * 10;
    const c = 40 + Math.cos(i * 0.06) * 15 + (Math.random() - 0.5) * 8;
    revenue.push(r);
    cost.push(c);
    profit.push(r - c);
  }

  return [{ x, series: [revenue, cost, profit] }];
}

const COLORS = palette(3);

export default function CustomTooltipDemo() {
  const data = generateData();

  return (
    <div>
      <p className="text-demo text-muted mb-2">
        Custom tooltip via <code>&lt;Tooltip&gt;&#123;(data) =&gt; ...&#125;&lt;/Tooltip&gt;</code> children
        render prop. Full control over tooltip layout and styling.
      </p>
      <Chart width={800} height={400} data={data} xlabel="Day" ylabel="Value ($K)">
        <Series group={0} index={0} label="Revenue" stroke={COLORS[0]} />
        <Series group={0} index={1} label="Cost" stroke={COLORS[1]} />
        <Series group={0} index={2} label="Profit" stroke={COLORS[2]} />
        <Legend />
        <Tooltip>
          {(tooltipData) => (
            <div className="bg-white border border-border-light rounded-md px-3 py-2 shadow-lg text-demo min-w-35">
              <div className="font-bold mb-1 border-b border-border-lighter pb-1">
                Day {tooltipData.xLabel}
              </div>
              {tooltipData.items.map((item, i) => {
                const val = item.value;
                const isProfit = item.label === 'Profit';
                return (
                  <div key={i} className="flex justify-between gap-4 py-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span
                      className={isProfit && val != null ? (val >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-500') : 'text-gray-800'}>
                      {val != null ? `$${val.toFixed(1)}K` : '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Tooltip>
      </Chart>
    </div>
  );
}
