import React from 'react';
import { Chart, Scale, Axis, Timeline, Side } from 'uplot-plus';
import type { ChartData, TimelineLane } from 'uplot-plus';

function generateData(): ChartData {
  // X values spanning 24 hours (in seconds from midnight)
  const x: number[] = [];
  for (let i = 0; i <= 86400; i += 3600) {
    x.push(i);
  }
  // Dummy y-series (not drawn, just needed for scale auto-ranging)
  const y = x.map(() => 0);
  return [{ x, series: [y] }];
}

const lanes: TimelineLane[] = [
    {
      label: 'Server A',
      segments: [
        { start: 0, end: 14400, color: '#4caf50', label: 'Running' },
        { start: 14400, end: 18000, color: '#ff9800', label: 'Idle' },
        { start: 18000, end: 36000, color: '#4caf50', label: 'Running' },
        { start: 36000, end: 39600, color: '#f44336', label: 'Error' },
        { start: 39600, end: 72000, color: '#4caf50', label: 'Running' },
        { start: 72000, end: 86400, color: '#ff9800', label: 'Idle' },
      ],
    },
    {
      label: 'Server B',
      segments: [
        { start: 0, end: 7200, color: '#ff9800', label: 'Idle' },
        { start: 7200, end: 50400, color: '#4caf50', label: 'Running' },
        { start: 50400, end: 54000, color: '#f44336', label: 'Error' },
        { start: 54000, end: 86400, color: '#4caf50', label: 'Running' },
      ],
    },
    {
      label: 'Server C',
      segments: [
        { start: 0, end: 21600, color: '#4caf50', label: 'Running' },
        { start: 21600, end: 28800, color: '#2196f3', label: 'Maintenance' },
        { start: 28800, end: 86400, color: '#4caf50', label: 'Running' },
      ],
    },
    {
      label: 'Server D',
      segments: [
        { start: 0, end: 43200, color: '#4caf50', label: 'Running' },
        { start: 43200, end: 46800, color: '#ff9800', label: 'Idle' },
        { start: 46800, end: 86400, color: '#4caf50', label: 'Running' },
      ],
    },
];

export default function TimelineDiscreteDemo() {
  const data = generateData();

  return (
    <Chart width={900} height={200} data={data}>
      <Scale id="x"  />
      <Scale id="y"  />
      <Axis
        scale="x"
        side={Side.Bottom}
        label="Time of Day"
        values={(splits: number[]) => splits.map(v => {
          const h = Math.floor(v / 3600);
          return `${h.toString().padStart(2, '0')}:00`;
        })}
      />
      <Axis scale="y" show={false} size={80} />
      <Timeline lanes={lanes} laneHeight={28} gap={4} scaleId="x" />
    </Chart>
  );
}
