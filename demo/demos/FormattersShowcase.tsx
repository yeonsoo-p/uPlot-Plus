import type { ReactNode } from 'react';
import { Chart, Series, Axis, Scale, fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels } from 'uplot-plus';
import { Side } from 'uplot-plus';

const W = 380;
const H = 200;

function SmallChart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="inline-block m-1">
      <div className="text-xs font-semibold mb-0.5">{title}</div>
      {children}
    </div>
  );
}

export default function FormattersShowcase() {
  // fmtCompact: large numbers
  const compactX = Array.from({ length: 20 }, (_, i) => i);
  const compactY = compactX.map(i => Math.pow(10, 2 + i * 0.3));
  const compactData = [{ x: compactX, series: [compactY] }];

  // fmtSuffix: temperature
  const suffX = Array.from({ length: 24 }, (_, i) => i);
  const suffY = suffX.map(i => 15 + Math.sin(i * 0.3) * 10);
  const suffData = [{ x: suffX, series: [suffY] }];

  // fmtHourMin: time of day
  const now = Math.floor(Date.now() / 1000);
  const hourX = Array.from({ length: 48 }, (_, i) => now + i * 1800);
  const hourY = hourX.map((_, i) => 40 + Math.sin(i * 0.15) * 25);
  const hourData = [{ x: hourX, series: [hourY] }];

  // fmtMonthName: monthly data
  const jan2025 = 1735689600;
  const monthX = Array.from({ length: 12 }, (_, i) => jan2025 + i * 30 * 86400);
  const monthY = monthX.map((_, i) => 50 + Math.sin(i * 0.5) * 30);
  const monthData = [{ x: monthX, series: [monthY] }];

  // fmtDateStr: date/time
  const dateX = Array.from({ length: 30 }, (_, i) => now + i * 86400);
  const dateY = dateX.map((_) => 20 + Math.random() * 60);
  const dateData = [{ x: dateX, series: [dateY] }];

  // fmtLabels: categorical
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const catX = Array.from({ length: 7 }, (_, i) => i);
  const catY = [65, 59, 80, 81, 56, 55, 72];
  const catData = [{ x: catX, series: [catY] }];

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        <SmallChart title="fmtCompact — SI suffixes (K, M, B)">
          <Chart width={W} height={H} data={compactData}>
            <Scale id="y" auto />
            <Axis scale="y" side={Side.Left} values={fmtCompact()} />
            <Series stroke="#e74c3c" />
          </Chart>
        </SmallChart>

        <SmallChart title="fmtSuffix — append units (°C)">
          <Chart width={W} height={H} data={suffData}>
            <Scale id="y" auto />
            <Axis scale="y" side={Side.Left} values={fmtSuffix('°C', 1)} />
            <Series stroke="#3498db" />
          </Chart>
        </SmallChart>

        <SmallChart title="fmtHourMin — HH:MM from timestamps">
          <Chart width={W} height={H} data={hourData}>
            <Scale id="x" time auto />
            <Axis scale="x" side={Side.Bottom} values={fmtHourMin()} />
            <Series stroke="#2ecc71" />
          </Chart>
        </SmallChart>

        <SmallChart title="fmtMonthName — month names">
          <Chart width={W} height={H} data={monthData}>
            <Scale id="x" time auto />
            <Axis scale="x" side={Side.Bottom} values={fmtMonthName()} />
            <Series stroke="#9b59b6" />
          </Chart>
        </SmallChart>

        <SmallChart title="fmtDateStr — custom Intl format">
          <Chart width={W} height={H} data={dateData}>
            <Scale id="x" time auto />
            <Axis scale="x" side={Side.Bottom} values={fmtDateStr({ month: 'short', day: 'numeric' })} />
            <Series stroke="#e67e22" />
          </Chart>
        </SmallChart>

        <SmallChart title="fmtLabels — categorical labels">
          <Chart width={W} height={H} data={catData}>
            <Scale id="x" auto />
            <Axis scale="x" side={Side.Bottom} values={fmtLabels(labels)} />
            <Series stroke="#1abc9c" />
          </Chart>
        </SmallChart>
      </div>
    </div>
  );
}
