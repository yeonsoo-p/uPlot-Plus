import { useMemo } from 'react';
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
  const data = useMemo(() => generateData(), []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mt-0 mb-2">Cursor mode — custom render function</h4>
        <Chart width="auto" height={400} data={data} xlabel="Day" ylabel="Value ($K)">
          <Series label="Revenue" stroke={COLORS[0]} />
          <Series label="Cost" stroke={COLORS[1]} />
          <Series label="Profit" stroke={COLORS[2]} />
          <Legend />
          <Tooltip>
            {(tooltipData) => (
              <div className="bg-white dark:bg-[#1e1e2e] border border-border-light dark:border-border-lighter dark:text-white rounded-md px-3 py-2 shadow-lg text-demo min-w-35">
                <div className="font-bold mb-1 border-b border-border-lighter dark:border-border-light pb-1">
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
                        className={isProfit && val != null ? (val >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-500') : 'text-gray-800 dark:text-gray-300'}>
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

      <div>
        <h4 className="mt-0 mb-2">Draggable mode — drag to reposition, values update with cursor</h4>
        <Chart width="auto" height={400} data={data} xlabel="Day" ylabel="Value ($K)">
          <Series label="Revenue" stroke={COLORS[0]} />
          <Series label="Cost" stroke={COLORS[1]} />
          <Series label="Profit" stroke={COLORS[2]} />
          <Legend />
          <Tooltip mode="draggable" position="top-left" />
        </Chart>
      </div>
    </div>
  );
}
