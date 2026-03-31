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
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
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
            <div style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: 13,
              minWidth: 140,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                Day {tooltipData.xLabel}
              </div>
              {tooltipData.items.map((item, i) => {
                const val = item.value;
                const isProfit = item.label === 'Profit';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '2px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      {item.label}
                    </span>
                    <span style={{
                      fontWeight: isProfit ? 700 : 400,
                      color: isProfit && val != null ? (val >= 0 ? '#27ae60' : '#e74c3c') : '#333',
                    }}>
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
